"use server";

import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { fetchMutation } from "convex/nextjs";
import type { FunctionReference } from "convex/server";
import { inngest } from "@/app/api/inngest/client";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

type ProjectsApiShape = {
  createProject: FunctionReference<"mutation">;
  deleteProject: FunctionReference<"mutation">;
  updateProjectDisplayName: FunctionReference<"mutation">;
};

function validateProjectsApi(
  apiObj: unknown,
): apiObj is { projects: ProjectsApiShape } {
  if (!apiObj || typeof apiObj !== "object") return false;
  const projects = (apiObj as Record<string, unknown>).projects;
  if (!projects || typeof projects !== "object") return false;
  const p = projects as Record<string, unknown>;
  return (
    p.createProject != null &&
    p.deleteProject != null &&
    p.updateProjectDisplayName != null
  );
}

if (!validateProjectsApi(api)) {
  throw new Error(
    "[projects] Convex API shape mismatch: api.projects must expose createProject, deleteProject, and updateProjectDisplayName",
  );
}
const projectsApi = api.projects;

type Auth = Awaited<ReturnType<typeof auth>>;

/**
 * Check upload limits (file size and optional duration). Used by validate and create actions.
 */
async function checkUploadLimits(
  _authObj: Auth,
  _userId: string,
  fileSize: number,
): Promise<{
  allowed: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}> {
  if (fileSize <= 0) {
    return {
      allowed: false,
      error: "Invalid file size",
      metadata: { fileSize },
    };
  }
  if (fileSize > MAX_FILE_SIZE) {
    const limitMb = MAX_FILE_SIZE / (1024 * 1024);
    return {
      allowed: false,
      error: `File exceeds ${limitMb}MB plan limit. Upgrade your plan to upload larger files or more projects.`,
      metadata: { fileSize, limit: MAX_FILE_SIZE },
    };
  }
  return { allowed: true };
}

/**
 * Project Server Actions
 *
 * Next.js server actions for project creation and workflow triggering.
 * Called from client components after file upload completes.
 *
 * Why server actions (vs API routes):
 * - RSC feature: no route file, just async functions; type-safe end-to-end.
 * - Runs on server only; client cannot bypass or call server-only APIs directly.
 *
 * Security & feature gating:
 * - Auth via Clerk; plan limits enforced here (defense-in-depth with upload route).
 */

export async function validateUploadAction(input: {
  fileSize: number;
  duration?: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  const authObj = await auth();
  const { userId } = authObj;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }
  const validation = await checkUploadLimits(authObj, userId, input.fileSize);
  if (!validation.allowed) {
    console.log(`Upload failed: ${validation.error}`, {
      userId,
      reason: validation.error,
      message: validation.error,
      metadata: validation.metadata,
    });
    return { success: false, error: validation.error ?? "Upload not allowed" };
  }
  console.log("[VALIDATE_UPLOAD] Upload validation started", {
    userId,
    fileSize: input.fileSize,
    fileSizeInMb: input.fileSize / 1024 / 1024,
  });
  return { success: true };
}

interface CreateProjectInput {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileDuration?: number;
}

/**
 * Create project and trigger Inngest workflow
 *
 * Called after the client has uploaded the file to Vercel Blob. Runs atomically:
 * validate auth + plan limits → create Convex project (status: "uploaded") →
 * send "podcast/uploaded" to Inngest. Client then redirects to the project page.
 *
 * Flow (defense-in-depth: upload route + this action both enforce limits):
 * 1. Auth (Clerk) and required fields (fileUrl, fileName)
 * 2. Plan and limits (checkUploadLimits)
 * 3. Convex: create project with file metadata
 * 4. Inngest: send event with projectId, userId, plan, fileUrl so workflow can process
 *
 * Throws on auth failure, missing fields, limit exceeded, or Convex/Inngest failure.
 * Caller should catch and show error toast + retry.
 *
 * @param input - Blob URL and file metadata from upload
 * @returns projectId for router.push
 * @throws Error when auth fails, limits exceeded, or required fields missing
 */
export async function createProjectAction(
  input: CreateProjectInput,
): Promise<
  { success: true; projectId: string } | { success: false; error: string }
> {
  try {
    const authObj = await auth();
    const { userId } = authObj;
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const { fileUrl, fileName, fileSize, mimeType, fileDuration } = input;

    if (!fileUrl || !fileName) {
      return { success: false, error: "Missing required fields" };
    }

    let plan: "free" | "pro" | "ultra" = "free";
    const { has } = authObj;
    if (has?.({ plan: "ultra" })) {
      plan = "ultra";
    } else if (has?.({ plan: "pro" })) {
      plan = "pro";
    }

    const validation = await checkUploadLimits(authObj, userId, fileSize ?? 0);

    if (!validation.allowed) {
      console.log("[VALIDATE_UPLOAD] Upload validation failed", {
        userId,
        reason: validation.error,
        message: validation.error,
        metadata: validation.metadata,
      });
      return {
        success: false,
        error: validation.error ?? "Upload Limit Exceeded",
      };
    }

    const fileExtension = fileName.split(".").pop() ?? "Unknown";

    const token = await authObj.getToken({ template: "convex" });
    const projectId = await fetchMutation(
      projectsApi.createProject,
      {
        userId,
        inputUrl: fileUrl,
        fileName,
        fileSize: fileSize ?? 0,
        fileDuration,
        fileFormat: fileExtension,
        mimeType,
      },
      { token: token ?? undefined },
    );

    const eventPayload = {
      name: "podcast/uploaded" as const,
      data: {
        projectId,
        userId,
        plan,
        fileUrl,
        fileName,
        fileSize: fileSize ?? 0,
        fileDuration,
        fileFormat: fileExtension,
        mimeType,
      },
    };

    const maxAttempts = 3;
    const baseDelayMs = 500;
    let lastError: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await inngest.send(eventPayload);
        break;
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts - 1) {
          const delayMs = baseDelayMs * 2 ** attempt;
          await new Promise((r) => setTimeout(r, delayMs));
        } else {
          console.error(
            "[createProjectAction] inngest.send failed after retries",
            {
              projectId,
              userId,
              attempt: attempt + 1,
              error: err,
            },
          );
          return {
            success: false,
            error:
              lastError instanceof Error
                ? lastError.message
                : "Failed to trigger processing. Please try again.",
          };
        }
      }
    }

    return { success: true, projectId };
  } catch (error) {
    console.error("Error Creating Project, Please Try Again Later:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteProjectAction(
  projectId: Id<"projects">,
): Promise<{ success: true } | { success: false; error: string }> {
  const authObj = await auth();
  const { userId } = authObj;
  if (!userId) {
    return {
      success: false,
      error: "Unauthorized, You Must Be Logged In To Delete A Project",
    };
  }

  try {
    const token = await authObj.getToken({ template: "convex" });
    const result = await fetchMutation(
      projectsApi.deleteProject,
      { projectId, userId },
      { token: token ?? undefined },
    );

    if (result?.inputUrl) {
      const maxAttempts = 3;
      const backoffMs = 200;
      let lastError: unknown;
      let deleted = false;
      for (let attempt = 0; attempt < maxAttempts && !deleted; attempt++) {
        try {
          await del(result.inputUrl);
          deleted = true;
        } catch (error) {
          lastError = error;
          if (attempt < maxAttempts - 1) {
            await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
          } else {
            // Orphaned blob: project deleted but blob deletion failed — log for monitoring/cleanup
            console.warn(
              "[ORPHANED_BLOB] Vercel blob deletion failed after project delete",
              {
                projectId,
                userId,
                inputUrl: result.inputUrl,
                error:
                  lastError instanceof Error
                    ? lastError.message
                    : String(lastError),
              },
            );
          }
        }
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete project",
    };
  }
}

export async function updateDisplayNameAction(
  projectId: Id<"projects">,
  displayName: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authObj = await auth();
    const { userId } = authObj;
    if (!userId) {
      return {
        success: false,
        error:
          "Unauthorized, You Must Be Logged In To Update A Project Display Name",
      };
    }

    if (!displayName || displayName.trim().length === 0) {
      return {
        success: false,
        error:
          "Display Name Cannot Be Empty, Please Provide A Valid Display Name To Continue",
      };
    }

    if (displayName.length > 200) {
      return {
        success: false,
        error:
          "Display Name Cannot Be Longer Than 200 Characters, Please Provide A Shorter Display Name To Continue",
      };
    }

    const token = await authObj.getToken({ template: "convex" });
    await fetchMutation(
      projectsApi.updateProjectDisplayName,
      {
        projectId,
        userId,
        displayName: displayName.trim(),
      },
      { token: token ?? undefined },
    );

    return { success: true };
  } catch (error) {
    console.error("Error Updating Display Name:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

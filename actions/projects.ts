"use server";

import { inngest } from "@/app/api/inngest/client";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { fetchMutation } from "convex/nextjs";
import type { FunctionReference } from "convex/server";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

// Convex codegen may not have run yet; cast so api.projects is valid at compile time.
const projectsApi = (api as unknown as { projects: { createProjects: FunctionReference<"mutation">; deleteProjects: FunctionReference<"mutation">; updateProjectDisplayName: FunctionReference<"mutation"> } }).projects;

type Auth = Awaited<ReturnType<typeof auth>>;

/**
 * Check upload limits (file size and optional duration). Used by validate and create actions.
 */
async function checkUploadLimits(
  _authObj: Auth,
  _userId: string,
  fileSize: number,
): Promise<{ allowed: boolean; error?: string; metadata?: Record<string, unknown> }> {
  if (fileSize <= 0) {
    return { allowed: false, error: "Invalid file size", metadata: { fileSize } };
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
export async function createProjectAction(input: CreateProjectInput): Promise<
  | { success: true; projectId: string }
  | { success: false; error: string }
> {
  try {
    const authObj = await auth();
    const { userId } = authObj;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { fileUrl, fileName, fileSize, mimeType, fileDuration } = input;

    if (!fileUrl || !fileName) {
      throw new Error("Missing required fields");
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
      projectsApi.createProjects,
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

    await inngest.send({
      name: "podcast/uploaded",
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
    });

    return { success: true, projectId };
  } catch (error) {
    console.error("Error Creating Project, Please Try Again Later:", error);
    throw error;
  }
}

export async function deleteProjectAction(
  projectId: Id<"projects">,
): Promise<{ success: true }> {
  try {
    const authObj = await auth();
    const { userId } = authObj;
    if (!userId) {
      throw new Error(
        "Unauthorized, You Must Be Logged In To Delete A Project",
      );
    }

    const token = await authObj.getToken({ template: "convex" });
    const result = await fetchMutation(
      projectsApi.deleteProjects,
      { projectId, userId },
      { token: token ?? undefined },
    );

    if (result?.inputUrl) {
      try {
        await del(result.inputUrl);
      } catch (error) {
        console.error("Error Deleting File From Vercel Blob:", error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error Deleting Project:", error);
    throw error;
  }
}

export async function updateDisplayNameAction(
  projectId: Id<"projects">,
  displayName: string,
): Promise<{ success: true }> {
  try {
    const authObj = await auth();
    const { userId } = authObj;
    if (!userId) {
      throw new Error(
        "Unauthorized, You Must Be Logged In To Update A Project Display Name",
      );
    }

    if (!displayName || displayName.trim().length === 0) {
      throw new Error(
        "Display Name Cannot Be Empty, Please Provide A Valid Display Name To Continue",
      );
    }

    if (displayName.length > 200) {
      throw new Error(
        "Display Name Cannot Be Longer Than 200 Characters, Please Provide A Shorter Display Name To Continue",
      );
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
    throw error;
  }
}

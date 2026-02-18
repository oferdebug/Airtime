'use server';

import { auth } from '@clerk/nextjs/server';
import { del } from '@vercel/blob';
import { fetchMutation } from 'convex/nextjs';
import type { FunctionReference } from 'convex/server';
import { inngest } from '@/app/api/inngest/client';
import { checkUploadLimits } from '@/lib/tier-utils';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

type ProjectsApiShape = {
  createProject: FunctionReference<'mutation'>;
  deleteProject: FunctionReference<'mutation'>;
  updateProjectDisplayName: FunctionReference<'mutation'>;
};

function validateProjectsApi(
  apiObj: unknown,
): apiObj is { projects: ProjectsApiShape } {
  if (!apiObj || typeof apiObj !== 'object') return false;
  const projects = (apiObj as Record<string, unknown>).projects;
  if (!projects || typeof projects !== 'object') return false;
  const p = projects as Record<string, unknown>;
  return (
    p.createProject != null &&
    p.deleteProject != null &&
    p.updateProjectDisplayName != null
  );
}

if (!validateProjectsApi(api)) {
  throw new Error(
    '[projects] Convex API shape mismatch: api.projects must expose createProject, deleteProject, and updateProjectDisplayName',
  );
}
const projectsApi = api.projects;

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
    return { success: false, error: 'Unauthorized' };
  }
  const validation = await checkUploadLimits(
    authObj,
    userId,
    input.fileSize,
    input.duration,
  );
  if (!validation.allowed) {
    console.log('[VALIDATE] Failed:', {
      userId,
      reason: validation.reason,
      message: validation.message,
    });
    return {
      success: false,
      error: validation.message ?? 'Upload not allowed',
    };
  }
  console.log('[VALIDATE] Passed:', { userId, fileSize: input.fileSize });
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
      return { success: false, error: 'Unauthorized' };
    }

    const { fileUrl, fileName, fileSize, mimeType, fileDuration } = input;

    if (!fileUrl || !fileName) {
      return { success: false, error: 'Missing required fields' };
    }

    if (
      fileSize == null ||
      typeof fileSize !== 'number' ||
      Number.isNaN(fileSize) ||
      fileSize <= 0
    ) {
      return {
        success: false,
        error: 'Invalid file size. Please provide a valid positive file size.',
      };
    }

    let plan: 'free' | 'pro' | 'ultra' = 'free';
    const { has } = authObj;
    if (has?.({ plan: 'ultra' })) {
      plan = 'ultra';
    } else if (has?.({ plan: 'pro' })) {
      plan = 'pro';
    }

    const validation = await checkUploadLimits(
      authObj,
      userId,
      fileSize,
      fileDuration,
    );

    if (!validation.allowed) {
      console.log('[VALIDATE] Failed:', {
        userId,
        reason: validation.reason,
        message: validation.message,
      });
      return {
        success: false,
        error: validation.message ?? 'Upload not allowed for your plan',
      };
    }

    const fileExtension = fileName.split('.').pop() ?? 'Unknown';

    const token = await authObj.getToken({ template: 'convex' });
    const projectId = await fetchMutation(
      projectsApi.createProject,
      {
        userId,
        inputUrl: fileUrl,
        fileName,
        fileSize,
        fileDuration,
        fileFormat: fileExtension,
        mimeType,
      },
      { token: token ?? undefined },
    );

    const eventPayload = {
      name: 'podcast/uploaded' as const,
      data: {
        projectId,
        userId,
        plan,
        fileUrl,
        fileName,
        fileSize,
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
            '[createProjectAction] inngest.send failed after retries',
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
                : 'Failed to trigger processing. Please try again.',
          };
        }
      }
    }

    return { success: true, projectId };
  } catch (error) {
    console.error('Error Creating Project, Please Try Again Later:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteProjectAction(
  projectId: Id<'projects'>,
): Promise<{ success: true } | { success: false; error: string }> {
  const authObj = await auth();
  const { userId } = authObj;
  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized, You Must Be Logged In To Delete A Project',
    };
  }

  try {
    const token = await authObj.getToken({ template: 'convex' });
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
              '[ORPHANED_BLOB] Vercel blob deletion failed after project delete',
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
    console.error('Error deleting project:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete project',
    };
  }
}

export async function updateDisplayNameAction(
  projectId: Id<'projects'>,
  displayName: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authObj = await auth();
    const { userId } = authObj;
    if (!userId) {
      return {
        success: false,
        error:
          'Unauthorized, You Must Be Logged In To Update A Project Display Name',
      };
    }

    if (!displayName || displayName.trim().length === 0) {
      return {
        success: false,
        error:
          'Display Name Cannot Be Empty, Please Provide A Valid Display Name To Continue',
      };
    }

    if (displayName.length > 200) {
      return {
        success: false,
        error:
          'Display Name Cannot Be Longer Than 200 Characters, Please Provide A Shorter Display Name To Continue',
      };
    }

    const token = await authObj.getToken({ template: 'convex' });
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
    console.error('Error Updating Display Name:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

'use server';

import { auth } from '@clerk/nextjs/server';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { del } from '@vercel/blob';
import { fetchMutation } from 'convex/nextjs';
import type { FunctionReference } from 'convex/server';
import { inngest } from '@/app/api/inngest/client';
import { checkUploadLimits } from '@/lib/tier-utils';

/**
 * Project Server Actions
 *
 * Next.js server actions for project creation and workflow triggering.
 * Called from client components after file upload completes.
 *
 * Server Actions vs. API Routes:
 * - Server actions are RSC (React Server Components) feature
 * - Simpler than API routes (no route definition, just async functions)
 * - Automatic form integration, progressive enhancement
 * - Type-safe: Client gets full TypeScript types
 *
 * Security & Feature Gating:
 * - Runs on server (access to server-only APIs)
 * - Validates auth via Clerk
 * - Validates plan limits (defense-in-depth with upload route)
 * - Can't be bypassed by client
 */

// Narrow the generated api type at runtime so we can safely access api.projects
type ProjectsApiShape = {
  createProject: FunctionReference<'mutation'>;
  deleteProject: FunctionReference<'mutation'>;
  updateProjectDisplayName: FunctionReference<'mutation'>;
  recordOrphanedBlob: FunctionReference<'mutation'>;
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
    p.updateProjectDisplayName != null &&
    p.recordOrphanedBlob != null
  );
}

function getProjectsApiValidationDetails(apiObj: unknown): string {
  if (!apiObj || typeof apiObj !== 'object') {
    return 'api is not an object';
  }

  const projects = (apiObj as Record<string, unknown>).projects;
  if (!projects || typeof projects !== 'object') {
    return 'api.projects is missing or not an object';
  }

  const p = projects as Record<string, unknown>;
  const missingMethods = [
    p.createProject == null ? 'createProject' : null,
    p.deleteProject == null ? 'deleteProject' : null,
    p.updateProjectDisplayName == null ? 'updateProjectDisplayName' : null,
    p.recordOrphanedBlob == null ? 'recordOrphanedBlob' : null,
  ].filter((name): name is string => name !== null);

  if (missingMethods.length === 0) {
    return 'validateProjectsApi(api) returned false unexpectedly';
  }

  return `api.projects is missing: ${missingMethods.join(', ')}`;
}

if (!validateProjectsApi(api)) {
  const errorMessage =
    '[projects] Convex API shape mismatch: api.projects must expose createProject, deleteProject, updateProjectDisplayName, and recordOrphanedBlob';
  const details = getProjectsApiValidationDetails(api);
  throw new Error(`${errorMessage}. Validation details: ${details}`);
}
const projectsApi = api.projects;

/**
 * Pre-validates upload against plan limits before starting the upload.
 * Returns success/error so the UI can show a clear message instead of opaque Blob errors.
 */
export async function validateUploadAction(input: {
  fileSize: number;
  duration?: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  const authObj = await auth();
  const { userId } = authObj;
  if (!userId) {
    return { success: false, error: 'Not authenticated' };
  }

  const fileSize = input.fileSize;
  if (
    fileSize == null ||
    typeof fileSize !== 'number' ||
    Number.isNaN(fileSize) ||
    fileSize <= 0
  ) {
    const msg = 'Invalid file size. Please provide a valid positive file size.';
    console.log('[VALIDATE] Failed:', { userId, reason: 'invalid_fileSize' });
    return { success: false, error: msg };
  }

  const validation = await checkUploadLimits(
    authObj,
    userId,
    fileSize,
    input.duration,
  );
  if (!validation.allowed) {
    console.log('[VALIDATE] Failed:', {
      userId,
      message: validation.message,
      reason: validation.reason,
      limit: validation.limit,
    });
    return {
      success: false,
      error: validation.message ?? 'Upload not allowed',
    };
  }

  console.log('[VALIDATE] Passed:', { userId, fileSize });
  return { success: true };
}

interface CreateProjectInput {
  fileUrl: string; // Vercel Blob URL
  fileName: string; // Original filename
  fileSize: number; // Bytes
  mimeType: string; // MIME type
  fileDuration?: number; // Seconds (optional)
}

/**
 * Create project and trigger Inngest workflow
 *
 * Atomic Operation (both or neither):
 * 1. Validate user's plan and limits
 * 2. Create project record in Convex with user's plan
 * 3. Send event to Inngest to start processing
 *
 * Flow:
 * 1. Client uploads file to Vercel Blob (validated in upload route)
 * 2. Client calls this server action with file metadata
 * 3. This action validates limits again (defense-in-depth)
 * 4. This action creates Convex project (status: "uploaded")
 * 5. This action triggers Inngest workflow with plan info
 * 6. Inngest processes podcast asynchronously based on plan
 * 7. Client redirects to project detail page
 *
 * Error Handling:
 * - Throws on auth failure (caught by client)
 * - Throws on missing fields (caught by client)
 * - Throws on plan limit exceeded (caught by client)
 * - Throws on Convex/Inngest errors (caught by client)
 * - Client shows error toast and allows retry
 *
 * @param input - File metadata from Vercel Blob upload
 * @returns Project ID for navigation
 * @throws Error if authentication fails, limits exceeded, or required fields missing
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

    // Validate fileSize before calling checkUploadLimits (CreateProjectInput requires it)
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

    // Determine user's plan via Clerk (optional downstream use)
    let plan: 'free' | 'pro' | 'ultra' = 'free';
    const { has } = authObj;
    if (has?.({ plan: 'ultra' })) plan = 'ultra';
    else if (has?.({ plan: 'pro' })) plan = 'pro';

    // Dev-only override for local feature testing without touching billing state.
    const devTestUserId = process.env.DEV_TEST_USER_ID?.trim();
    if (
      process.env.NODE_ENV === 'development' &&
      devTestUserId &&
      userId === devTestUserId
    ) {
      const originalPlan = plan;
      plan = 'ultra';
      console.warn('[createProjectAction] Dev plan override enabled', {
        userId,
        originalPlan,
        overriddenPlan: plan,
        devTestUserId,
      });
    }

    const validation = await checkUploadLimits(
      authObj,
      userId,
      fileSize,
      fileDuration,
      plan,
    );
    if (!validation.allowed) {
      return {
        success: false,
        error: validation.message ?? 'Upload not allowed for your plan',
      };
    }

    const fileExtension = fileName.split('.').pop() ?? 'unknown';

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

    // Inngest event with retry/backoff
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
          try {
            await del(fileUrl);
            console.log('[createProjectAction] Removed uploaded blob:', {
              userId,
              fileUrl,
            });
          } catch (blobDeleteErr) {
            console.error(
              '[createProjectAction] Failed to remove uploaded blob:',
              { userId, fileUrl, error: blobDeleteErr },
            );
          }
          // Remove orphaned project since Inngest workflow will not run
          try {
            await fetchMutation(
              projectsApi.deleteProject,
              { projectId, userId },
              { token: token ?? undefined },
            );
            console.log('[createProjectAction] Removed orphaned project:', {
              projectId,
              userId,
            });
          } catch (deleteErr) {
            console.error(
              '[createProjectAction] Failed to remove orphaned project:',
              { projectId, userId, error: deleteErr },
            );
          }
          // TODO: Implement scheduled cleanup job for stale "uploading" projects
          // TODO: Expose UI retry endpoint that calls inngest.send again using projectId
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

/**
 * Delete project and associated Blob storage
 */
export type DeleteProjectResult =
  | { success: true }
  | {
      success: false;
      error: string;
      partial?: boolean;
      orphanedBlob?: boolean;
      orphanedUrl?: string;
    };

export async function deleteProjectAction(
  projectId: Id<'projects'>,
): Promise<DeleteProjectResult> {
  try {
    const authObj = await auth();
    const { userId } = authObj;
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized, You Must Be Logged In To Delete A Project',
      };
    }

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
            await new Promise((r) => setTimeout(r, backoffMs * 2 ** attempt));
          } else {
            const errorMsg =
              lastError instanceof Error
                ? lastError.message
                : String(lastError);
            console.warn(
              '[ORPHANED_BLOB] Vercel blob deletion failed after project delete',
              {
                projectId,
                userId,
                inputUrl: result.inputUrl,
                error: errorMsg,
              },
            );
            // Persist failure for scheduled cleanup
            try {
              await fetchMutation(
                projectsApi.recordOrphanedBlob,
                {
                  projectId,
                  userId,
                  orphanedBlobUrl: result.inputUrl,
                  error: errorMsg,
                },
                { token: token ?? undefined },
              );
            } catch (recordErr) {
              console.error(
                '[ORPHANED_BLOB] Failed to record orphaned blob:',
                recordErr,
              );
            }
            return {
              success: false,
              error: `Project deleted but blob cleanup failed. ${errorMsg}`,
              partial: true,
              orphanedBlob: true,
              orphanedUrl: result.inputUrl,
            };
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

/**
 * Update project display name
 */
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

    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      return {
        success: false,
        error:
          'Display Name Cannot Be Empty, Please Provide A Valid Display Name To Continue',
      };
    }
    if (trimmedDisplayName.length > 200) {
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
        displayName: trimmedDisplayName,
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

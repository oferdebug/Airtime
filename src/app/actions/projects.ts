"use server";

import { MAX_FILE_SIZE } from "@/lib/constants";

/**
 * Pre-validates upload against plan limits before starting the upload.
 * Returns success/error so the UI can show a clear message instead of opaque Blob errors.
 */
export async function validateUploadAction(input: {
  fileSize: number;
  duration?: number;
}): Promise<{ success: true } | { success: false; error: string }> {
  if (input.fileSize <= 0) {
    return { success: false, error: "Invalid file size" };
  }
  if (input.fileSize > MAX_FILE_SIZE) {
    const limitMb = MAX_FILE_SIZE / (1024 * 1024);
    return {
      success: false,
      error: `File exceeds ${limitMb}MB plan limit. Upgrade your plan to upload larger files or more projects.`,
    };
  }
  // TODO: Check user's plan and project count (e.g. Convex) and return error if over limit.
  return { success: true };
}

/**
 * Creates the project in Convex and triggers the Inngest workflow.
 * Returns projectId for redirect to the project detail page.
 */
export async function createProjectAction(_input: {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileDuration?: number;
}): Promise<{ projectId: string }> {
  // TODO: Create project in Convex (mutation) and trigger Inngest event.
  // For now return a stable id so redirect works; replace with Convex + Inngest when ready.
  const projectId = `project-${Date.now()}`;
  return { projectId };
}

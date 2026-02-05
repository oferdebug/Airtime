/**
 * Shared type definitions for the podcast uploader.
 */

/**
 * Phase/workflow status: pending | running | completed | failed.
 */
export type PhaseStatus = "pending" | "running" | "completed" | "failed";

/**
 * Upload lifecycle state for the podcast uploader.
 *
 * - idle: No file selected or upload in progress
 * - uploading: File is being uploaded to Blob (0–100% progress)
 * - processing: Creating project and triggering workflow (100% progress)
 * - completed: Ready to view project (shows success message)
 * - error: Upload or processing failed (shows error message)
 */
export type UploadStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "error"
  | "canceled";

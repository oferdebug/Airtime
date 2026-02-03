/** Upload lifecycle state for the podcast uploader. */
export type UploadStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "error";

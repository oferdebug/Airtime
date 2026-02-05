"use client";

/**
 * Podcast Uploader
 *
 * Orchestrates the full podcast upload flow from file selection to project creation.
 *
 * ## Upload flow
 * 1. User selects file (UploadDropzone)
 * 2. Extract audio duration (for time estimates)
 * 3. Pre-validate against plan limits (server action)
 * 4. Upload to Vercel Blob (direct upload, progress tracked)
 * 5. Create project in Convex (server action)
 * 6. Trigger Inngest workflow (server action)
 * 7. Redirect to project detail page
 *
 * ## State
 * - selectedFile — file awaiting or in upload
 * - fileDuration — extracted/estimated duration (seconds)
 * - uploadProgress — 0–100%
 * - uploadStatus — idle | uploading | processing | completed | error
 *
 * ## Architecture notes
 * - Pre-validation (server action) avoids opaque Blob errors.
 * - Direct Blob upload skips Next.js server and supports large files.
 * - Server actions handle validation and project creation with a type-safe API.
 */
import { useAuth } from "@clerk/nextjs";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  createProjectAction,
  validateUploadAction,
} from "@/app/actions/projects";
import { UploadDropzone } from "@/components/Upload-Dropzone";
import { UploadProgress } from "@/components/Upload-Progress";
import { Button } from "@/components/ui/button";
import { estimateDurationFromSize, getAudioDuration } from "@/lib/audio-utils";
import type { UploadStatus } from "@/lib/types";

const UPLOAD_PATH_PREFIX = "uploads";
const MAX_FILENAME_LENGTH = 200;
const SAFE_FILENAME_REGEX = /[^A-Za-z0-9._-]/g;

function sanitizeFilename(name: string): string {
  const withoutPath = name.replace(/[/\\]/g, "").replace(/\.\./g, "");
  const withoutControl = Array.from(withoutPath)
    .filter((c) => {
      const code = c.codePointAt(0) ?? 0;
      return code > 31 && code !== 127;
    })
    .join("");
  const collapsed = withoutControl.replace(/\s+/g, " ").trim();
  const safe = collapsed.replace(SAFE_FILENAME_REGEX, "_");
  return safe.slice(0, MAX_FILENAME_LENGTH) || "audio";
}

export default function PodcastUploader() {
  const router = useRouter();
  const { userId } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDuration, setFileDuration] = useState<number | undefined>(
    undefined,
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const uploadControllerRef = useRef<AbortController | null>(null);

  const isBusy = uploadStatus === "uploading" || uploadStatus === "processing";

  /**
   * Handles file selection from the dropzone.
   *
   * Extracts audio duration so the UI can show processing-time estimates.
   * If extraction fails (e.g. unsupported format), falls back to a size-based estimate.
   */
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadStatus("idle");
    setUploadProgress(0);
    setError(null);

    try {
      const duration = await getAudioDuration(file);
      setFileDuration(duration);
    } catch {
      const estimated = estimateDurationFromSize(file.size);
      setFileDuration(estimated);
    }
  };

  /**
   * Starts upload: validates, uploads to Blob, creates project, then redirects.
   */
  const handleUpload = async () => {
    if (!selectedFile || !userId) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setUploadStatus("uploading");
      setUploadProgress(0);
      setError(null);

      const validation = await validateUploadAction({
        fileSize: selectedFile.size,
        duration: fileDuration,
      });

      if (!validation.success) {
        throw new Error(validation.error ?? "Validation failed");
      }

      const sanitizedName = sanitizeFilename(selectedFile.name);
      const pathname = `${UPLOAD_PATH_PREFIX}/${Date.now()}-${sanitizedName}`;
      const controller = new AbortController();
      uploadControllerRef.current = controller;

      const blob = await upload(pathname, selectedFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        onUploadProgress: ({ percentage }) => {
          setUploadProgress(percentage);
        },
      });

      if (controller.signal.aborted) {
        uploadControllerRef.current = null;
        setUploadStatus("canceled");
        setUploadProgress(0);
        setError(null);
        return;
      }
      uploadControllerRef.current = null;

      setUploadStatus("processing");
      setUploadProgress(100);

      const result = await createProjectAction({
        fileUrl: blob.url,
        fileName: sanitizedName,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        fileDuration,
      });

      if ("success" in result && result.success === false) {
        throw new Error(result.error);
      }
      const projectId = "projectId" in result ? result.projectId : undefined;
      if (!projectId) {
        throw new Error("Failed to create project");
      }

      toast.success("Upload completed! Processing your podcast...");
      setUploadStatus("completed");

      router.push(`/dashboard/projects/${projectId}`);
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (isAbort || uploadControllerRef.current?.signal.aborted) {
        setUploadStatus("canceled");
        setUploadProgress(0);
        setError(null);
        uploadControllerRef.current = null;
        return;
      }
      setUploadStatus("error");
      const message =
        err instanceof Error
          ? err.message
          : "Failed to upload file. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      uploadControllerRef.current = null;
    }
  };

  const handleAbort = () => {
    uploadControllerRef.current?.abort();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileDuration(undefined);
    setUploadStatus("idle");
    setUploadProgress(0);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!selectedFile && uploadStatus === "idle" && (
        <UploadDropzone onFileSelect={handleFileSelect} disabled={isBusy} />
      )}

      {selectedFile && (
        <>
          <UploadProgress
            fileName={selectedFile.name}
            fileSize={selectedFile.size}
            fileDuration={fileDuration}
            progress={uploadProgress}
            status={uploadStatus}
            error={error ?? undefined}
          />

          {(uploadStatus === "idle" ||
            uploadStatus === "error" ||
            uploadStatus === "canceled" ||
            uploadStatus === "uploading" ||
            uploadStatus === "processing") && (
            <div className="flex gap-3">
              {(uploadStatus === "idle" ||
                uploadStatus === "error" ||
                uploadStatus === "canceled") && (
                <Button onClick={handleUpload} className="flex-1">
                  {uploadStatus === "error" || uploadStatus === "canceled"
                    ? "Try Again"
                    : "Start Upload"}
                </Button>
              )}
              <Button
                onClick={isBusy ? handleAbort : handleReset}
                variant="outline"
              >
                {isBusy ? "Cancel Upload" : "Cancel"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

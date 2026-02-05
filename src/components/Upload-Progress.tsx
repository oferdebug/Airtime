"use client";
/**
 * Upload Progress Component
 *
 * Displays upload status, progress, and file metadata.
 * Provides visual feedback for upload and processing states.
 *
 * States:
 * - uploading: File being uploaded to Blob (0–100% progress)
 * - processing: Creating project and triggering workflow (100% progress)
 * - completed: Ready to view project (shows success message)
 * - error: Upload or processing failed (shows error message)
 *
 * File metadata: name (truncated), size, duration (if available), status icon.
 */

import { CheckCircle2, Clock, FileAudio, Loader2, XCircle } from "lucide-react";
import { formatDuration, formatFileSize } from "@/lib/utils";

export type UploadStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "error"
  | "canceled";

export interface UploadProgressProps {
  fileName: string;
  fileSize: number;
  fileDuration?: number;
  progress: number;
  status: UploadStatus;
  error?: string;
}

const STATUS_LABEL: Record<
  Exclude<UploadStatus, "completed" | "error" | "canceled">,
  string
> = {
  idle: "Ready to upload",
  uploading: "Uploading...",
  processing: "Processing...",
};

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === "idle") return null;
  if (status === "uploading" || status === "processing") {
    return (
      <Loader2 className="h-7 w-7 animate-spin text-emerald-600" aria-hidden />
    );
  }
  if (status === "completed") {
    return <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden />;
  }
  return <XCircle className="h-7 w-7 text-red-500" aria-hidden />;
}

function ErrorHint({ error }: { error: string }) {
  if (error.includes("plan limit")) {
    return (
      <p className="mt-3 pt-3 border-t border-red-200 text-xs text-gray-600">
        💡 Upgrade your plan to upload larger files or more projects
      </p>
    );
  }
  if (error.includes("Authentication")) {
    return (
      <p className="mt-3 pt-3 border-t border-red-200 text-xs text-gray-600">
        💡 Try refreshing the page or signing in again
      </p>
    );
  }
  return null;
}

export function UploadProgress({
  fileName,
  fileSize,
  fileDuration,
  progress,
  status,
  error,
}: UploadProgressProps) {
  const showProgressBar = status === "uploading" || status === "processing";

  return (
    <div className="glass-card-strong rounded-2xl p-6 hover-lift">
      <div className="space-y-6">
        {/* File metadata and status icon */}
        <div className="flex items-start gap-5">
          <div className="rounded-2xl bg-emerald-500 p-4 shadow-lg" aria-hidden>
            <FileAudio className="h-8 w-8 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-gray-900">
              {fileName}
            </p>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              <span className="font-medium">{formatFileSize(fileSize)}</span>
              {fileDuration != null && (
                <>
                  <span aria-hidden>•</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" aria-hidden />
                    <span className="font-medium">
                      {formatDuration(fileDuration)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <StatusIcon status={status} />
          </div>
        </div>

        {/* Progress bar */}
        {showProgressBar && (
          <div className="space-y-3">
            <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={STATUS_LABEL[status]}
              />
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-700">{STATUS_LABEL[status]}</span>
              <span className="text-emerald-600">{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {/* Completed message */}
        {status === "completed" && (
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-700">
              Upload completed! Redirecting to project dashboard...
            </p>
          </div>
        )}

        {/* Canceled message */}
        {status === "canceled" && (
          <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              Upload canceled
            </p>
            <p className="mt-1 text-sm text-amber-700">
              You can select a new file and try again.
            </p>
          </div>
        )}

        {/* Error message */}
        {status === "error" && error && (
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-4">
              <XCircle
                className="mt-0.5 h-6 w-6 shrink-0 text-red-600"
                aria-hidden
              />
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-bold text-red-900">Upload Failed</p>
                <p className="text-sm leading-relaxed text-red-700">{error}</p>
                <ErrorHint error={error} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

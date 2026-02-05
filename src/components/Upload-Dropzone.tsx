"use client";
/** biome-ignore-all assist/source/organizeImports: preserve import grouping for dropzone component clarity */
import { Upload, XCircleIcon } from "lucide-react";
import { useCallback } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { ACCEPT_AUDIO, MAX_FILE_SIZE } from "@/lib/constants";
import { cn, formatFileSize } from "@/lib/utils";

/**
 * Upload dropzone — drag-and-drop or click-to-browse with validation.
 *
 * - **Interaction**: Drag & drop or click to open file picker
 * - **Validation**: Audio MIME types only, enforced file size limit
 * - **Feedback**: Drag state, accept/reject styling, error messages
 * - **A11y**: Proper label, focus, and keyboard-friendly file input
 *
 * **Supported formats**: MP3, M4A, WAV, AAC, FLAC, OGG, Opus, WebM, 3GP, 3G2
 * (Multiple MIME variants per format for Chrome, Firefox, Safari consistency.)
 */

const DROPZONE_ID = "upload-dropzone";
const DROPZONE_LABEL_ID = "upload-dropzone-label";
const DROPZONE_DESC_ID = "upload-dropzone-desc";
const DROPZONE_ERROR_ID = "upload-dropzone-error";
interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  maxSize?: number;
  onReject?: (rejections: FileRejection[]) => void;
}

export function UploadDropzone({
  onFileSelect,
  disabled = false,
  maxSize = MAX_FILE_SIZE,
  onReject,
}: UploadDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect],
  );

  const onDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      onReject?.(rejections);
    },
    [onReject],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    onDrop,
    onDropRejected: onReject ? onDropRejected : undefined,
    accept: ACCEPT_AUDIO,
    maxSize,
    maxFiles: 1,
    disabled,
    noKeyboard: false,
  });

  const errorMessage = fileRejections?.[0]?.errors?.[0]?.message;
  const hasError = Boolean(errorMessage);

  return (
    <div className="w-full" id={DROPZONE_ID}>
      <div
        {...getRootProps({
          "aria-describedby": hasError
            ? `${DROPZONE_DESC_ID} ${DROPZONE_ERROR_ID}`
            : DROPZONE_DESC_ID,
          "aria-invalid": hasError,
          "aria-labelledby": DROPZONE_LABEL_ID,
        })}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 text-center transition-all outline-none",
          "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
          "border-brand-300 bg-brand-50/30 hover:border-brand-500 hover:bg-brand-50/50",
          isDragActive &&
            !isDragReject &&
            "border-brand-600 bg-brand-100/80 scale-[1.01] shadow-lg",
          isDragReject && "border-red-600 bg-red-50/50",
          disabled && "cursor-not-allowed opacity-60",
          hasError && "border-red-600 bg-red-50/30",
          !disabled && "cursor-pointer",
        )}
      >
        <input
          {...getInputProps()}
          id={`${DROPZONE_ID}-input`}
          aria-labelledby={DROPZONE_LABEL_ID}
          aria-describedby={DROPZONE_DESC_ID}
        />
        <div className="flex flex-col items-center gap-3">
          {isDragReject ? (
            <XCircleIcon className="h-8 w-8 text-red-700" />
          ) : disabled ? (
            <XCircleIcon className="h-8 w-8 text-stone-500" />
          ) : (
            <Upload className="h-8 w-8 text-brand-500" />
          )}
          <p
            id={DROPZONE_LABEL_ID}
            className="text-base font-medium text-stone-800"
          >
            {isDragActive
              ? isDragReject
                ? "Wrong format or file too large"
                : "Drop your audio file here"
              : "Drag & drop your audio file, or click to browse your files"}
          </p>
          <p id={DROPZONE_DESC_ID} className="text-sm text-stone-500">
            {formatFileSize(maxSize)} max · MP3, M4A, WAV, AAC, FLAC, OGG, Opus,
            WebM, 3GP
          </p>
        </div>
      </div>
      {errorMessage && (
        <p
          id={DROPZONE_ERROR_ID}
          className="mt-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
export default UploadDropzone;

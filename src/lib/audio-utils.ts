/**
 * Audio Utilities
 *
 * Helpers for extracting and estimating audio file durations.
 * Used in upload flow to provide processing time estimates.
 *
 * Why Duration Extraction?
 * - Shows users expected processing time before upload
 * - Validates file is valid audio (extraction fails for corrupted files)
 * - Improves UX with accurate progress estimates
 */

/**
 * Extract duration from an audio file using HTML5 Audio API
 *
 * Creates an in-memory Audio element, loads file metadata, and extracts duration.
 * Works in browser environment only (client-side).
 *
 * Process:
 * 1. Create object URL from File blob
 * 2. Load into Audio element
 * 3. Extract duration from loadedmetadata event
 * 4. Clean up object URL
 *
 * Error Handling:
 * - Rejects if file is not valid audio
 * - Rejects if browser can't decode format
 * - Always cleans up object URL (prevents memory leaks)
 *  *
 * @param file - Audio File object
 * @returns Duration in seconds (floored to integer)
 * @throws Error if file cannot be loaded or is invalid
 */

export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.addEventListener("loadedmetadata", () => {
      const duration = audio.duration;
      if (!Number.isFinite(duration)) {
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error(
            "Invalid or undecodable audio duration; file may be corrupted or unsupported",
          ),
        );
        return;
      }
      const safeDuration = Math.min(
        Math.max(0, Math.floor(duration)),
        Number.MAX_SAFE_INTEGER,
      );
      resolve(safeDuration);
      URL.revokeObjectURL(objectUrl);
    });
    audio.addEventListener("error", () => {
      reject(new Error("Failed to load audio metadata"));
      URL.revokeObjectURL(objectUrl);
    });
    audio.src = objectUrl;
    audio.load();
  });
}
/**
 * Estimate duration from file size (fallback)
 *
 * Rough approximation when metadata extraction fails (corrupted file,
 * unsupported format, or decode error). Used for progress estimates only.
 *
 * Formula:
 * - Assumes 1 MB of audio ≈ 8 minutes (conservative; typical 128kbps MP3 is ~1 min/MB).
 * - duration (seconds) = fileSize (MB) × 8 × 60
 *
 * Accuracy:
 * - ±30% for typical podcast audio (bitrate and format vary).
 * - Good enough for progress bars; not for precise timing or display.
 *
 * @param fileSize - File size in bytes
 * @returns Estimated duration in seconds (floored)
 */
export function estimateDurationFromSize(fileSize: number): number {
  // 128 kbps ≈ 16 KB/s → bytes / 16000 ≈ seconds
  const bytesPerSecond = 16000;
  return Math.floor(fileSize / bytesPerSecond);
}

/**
 * Audio utilities for duration extraction and estimation.
 * Used by the podcast uploader for processing-time estimates.
 */

/**
 * Extracts duration in seconds from an audio file using the browser's Audio API.
 * Resolves when metadata is loaded; rejects if the file cannot be decoded.
 */
export async function getAudioDuration(file: File): Promise<number> {
  const url = URL.createObjectURL(file);
  try {
    const audio = new Audio(url);
    const duration = await new Promise<number>((resolve, reject) => {
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
      });
      audio.addEventListener("error", () => {
        reject(new Error("Failed to load audio metadata"));
      });
    });
    return Math.floor(duration);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Estimates duration in seconds from file size (rough approximation).
 * Assumes ~128 kbps encoded audio (1 MB ≈ 60 s). Use when metadata extraction fails.
 */
export function estimateDurationFromSize(bytes: number): number {
  // 128 kbps ≈ 16 KB/s → bytes / 16000 ≈ seconds
  return Math.floor(bytes / 16000);
}

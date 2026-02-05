/**
 * Formatting Utilities
 *
 * Collection of formatters for displaying data in the UI.
 * Handles file sizes, durations, timestamps, dates, numbers, percentages,
 * plurals, lists, and text with consistent formatting.
 *
 * Uses established libraries (bytes, date-fns) and Intl for robust, localized formatting.
 */
import bytes from "bytes";
import { format } from "date-fns";
import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from "./constants";

/**
 * Format file size in human-readable format
 *
 * Examples:
 * - 1024 → "1 KB"
 * - 1048576 → "1 MB"
 * - 1073741824 → "1 GB"
 *
 * Uses bytes library for consistent cross-platform formatting.
 */
export function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) return "0 B";
  return bytes(size, { unitSeparator: " ", decimalPlaces: 1 }) ?? "0 B";
}

/**
 * Format duration in MM:SS or HH:MM:SS format
 *
 * Examples:
 * - 65 seconds → "1:05"
 * - 3665 seconds → "1:01:05"
 *
 * Automatically includes hours only if needed.
 * Always pads minutes and seconds with leading zeros.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, "0");

  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(secs)}`;
  return `${minutes}:${pad(secs)}`;
}

/**
 * Format seconds as a time string with flexible options
 *
 * Use cases:
 * - YouTube timestamps: forceHours=false (shortest format)
 * - Key moments: forceHours=true, padHours=true (consistent length)
 * - Video players: forceHours=true (standard format)
 *
 * Examples:
 * - 65, default → "01:05"
 * - 65, { padHours: false } → "1:05"
 * - 65, { forceHours: true } → "00:01:05"
 */
export function formatTimestampSeconds(
  seconds: number,
  options?: { padHours?: boolean; forceHours?: boolean },
): string {
  const { padHours = true, forceHours = false } = options ?? {};

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const hoursStr = padHours ? String(hours).padStart(2, "0") : String(hours);
  const minutesStr = String(minutes).padStart(2, "0");
  const secsStr = String(secs).padStart(2, "0");

  if (hours > 0 || forceHours) {
    return `${hoursStr}:${minutesStr}:${secsStr}`;
  }
  return `${minutesStr}:${secsStr}`;
}

/**
 * Format timestamp (ms or Date) as human-readable date and time
 *
 * Examples:
 * - 1704067200000 → "Jan 1, 2024 12:00 PM"
 *
 * Uses date-fns with "MMM d, yyyy h:mm a".
 * Good for: detail pages, logs, single timestamps.
 */
export function formatTimestamp(timestamp: number | Date): string {
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  return format(date, "MMM d, yyyy h:mm a");
}

/**
 * Format date only (ISO-style date)
 *
 * Examples:
 * - 1704067200000 → "2024-01-01"
 *
 * Good for: lists, tables, API display, blog post dates.
 */
export function formatDate(dateParam: number | Date): string {
  const date = typeof dateParam === "number" ? new Date(dateParam) : dateParam;
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  return format(date, "yyyy-MM-dd");
}

/**
 * Format time only (24h HH:MM:SS)
 *
 * Examples:
 * - 1704067200000 → "12:00:00"
 *
 * Good for: time-only display, durations from midnight.
 */
export function formatTime(dateParam: number | Date): string {
  const date = typeof dateParam === "number" ? new Date(dateParam) : dateParam;
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  return format(date, "HH:mm:ss");
}

/**
 * Format date and time (ISO-style, local)
 *
 * Examples:
 * - 1704067200000 → "2024-01-01 12:00:00"
 *
 * Good for: exports, logs, full datetime in local timezone.
 */
export function formatDateTime(dateParam: number | Date): string {
  const date = typeof dateParam === "number" ? new Date(dateParam) : dateParam;
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  return format(date, "yyyy-MM-dd HH:mm:ss");
}

/**
 * Format date and time in local timezone (same as formatDateTime).
 *
 * Alias for consistency where "local" is explicitly desired.
 */
export function formatDateTimeLocal(dateParam: number | Date): string {
  return formatDateTime(dateParam);
}

/**
 * Format date in full localized format
 *
 * Uses date-fns "PPpp" for localized date and time.
 * Example: "Apr 29, 2023 at 8:30 PM"
 *
 * Good for: detail pages, logs, human-friendly timestamps.
 */
export function formatDateLong(timestamp: number | Date): string {
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  return format(date, "PPpp");
}

/**
 * Format date in smart relative format
 *
 * Shows relative time for recent dates, absolute date for older ones:
 * - < 1 minute: "Just now"
 * - < 1 hour: "15m ago"
 * - < 24 hours: "3h ago"
 * - < 7 days: "2d ago"
 * - Older: localized date (e.g. "4/29/2023")
 *
 * Good for: lists, feeds, activity streams.
 * Improves UX by showing contextually relevant time format.
 */
export function formatSmartDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / MS_PER_MINUTE);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMs / MS_PER_HOUR);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffMs / MS_PER_DAY);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// ─── Numbers & percentages ─────────────────────────────────────────────────

/**
 * Format number with locale-aware grouping and optional decimals
 *
 * Examples:
 * - 1234567.89 → "1,234,567.89" (en-US)
 * - 1234567.89, 0 → "1,234,568"
 *
 * Uses Intl.NumberFormat. Good for: stats, counts, displayed numbers.
 */
export function formatNumber(
  value: number,
  options?: { decimals?: number; locale?: string },
): string {
  if (!Number.isFinite(value)) return "0";
  const { decimals = 2, locale = "en-US" } = options ?? {};
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format large numbers in compact form (K, M, B)
 *
 * Examples:
 * - 1200 → "1.2K"
 * - 3500000 → "3.5M"
 * - 1200000000 → "1.2B"
 * - 999 → "999" (no suffix)
 *
 * Good for: view counts, follower counts, large stats in limited space.
 */
export function formatCompactNumber(value: number, decimals = 1): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  if (value < 1000) return String(Math.round(value));
  const units = [
    { threshold: 1e12, suffix: "T" },
    { threshold: 1e9, suffix: "B" },
    { threshold: 1e6, suffix: "M" },
    { threshold: 1e3, suffix: "K" },
  ];
  for (const { threshold, suffix } of units) {
    if (value >= threshold) {
      const scaled = value / threshold;
      const formatted =
        scaled % 1 === 0
          ? String(Math.round(scaled))
          : scaled.toFixed(decimals).replace(/\.?0+$/, "");
      return `${formatted}${suffix}`;
    }
  }
  return String(value);
}

/**
 * Format value as percentage
 *
 * Examples:
 * - 0.456 → "45.6%"
 * - 0.456, 0 → "46%"
 * - 1 → "100%"
 *
 * Input should be 0–1 (or 0–100 if wholeNumber is true).
 * Good for: progress bars, completion rates, analytics.
 */
export function formatPercent(
  value: number,
  options?: { decimals?: number; wholeNumber?: boolean },
): string {
  if (!Number.isFinite(value)) return "0%";
  const { decimals = 1, wholeNumber = false } = options ?? {};
  const normalized = wholeNumber ? value / 100 : value;
  const pct = Math.min(1, Math.max(0, normalized)) * 100;
  return `${pct.toFixed(decimals)}%`;
}

/**
 * Return singular or plural label based on count
 *
 * Examples:
 * - pluralize(1, "episode") → "1 episode"
 * - pluralize(5, "episode") → "5 episodes"
 * - pluralize(2, "child", "children") → "2 children"
 *
 * Good for: dynamic copy, lists, "X items" labels.
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const n = Number.isFinite(count) ? Math.abs(count) : 0;
  const word = n === 1 ? singular : (plural ?? `${singular}s`);
  return `${n} ${word}`;
}

/**
 * Format ordinal number (1st, 2nd, 3rd, 4th)
 *
 * Examples:
 * - 1 → "1st"
 * - 2 → "2nd"
 * - 3 → "3rd"
 * - 21 → "21st"
 *
 * Good for: rankings, "Xth episode", list positions.
 */
export function formatOrdinal(n: number): string {
  if (!Number.isInteger(n) || n < 0) return String(n);
  const s = String(n);
  const last = s.slice(-1);
  const lastTwo = s.slice(-2);
  const lastTwoNum = parseInt(lastTwo, 10);
  if (lastTwoNum >= 11 && lastTwoNum <= 13) return `${n}th`;
  if (last === "1") return `${n}st`;
  if (last === "2") return `${n}nd`;
  if (last === "3") return `${n}rd`;
  return `${n}th`;
}

// ─── Duration (human-readable) ─────────────────────────────────────────────

/**
 * Format duration as short human-readable string
 *
 * Examples:
 * - 65 → "1m 5s"
 * - 3665 → "1h 1m 5s"
 * - 90 → "1m 30s"
 *
 * Omits zero segments. Good for: tooltips, secondary labels, compact UI.
 */
export function formatDurationLong(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0s";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  return parts.join(" ");
}

// ─── Lists & text ───────────────────────────────────────────────────────────

/**
 * Format array of strings as a single sentence with conjunction
 *
 * Examples:
 * - ["A", "B", "C"] → "A, B, and C"
 * - ["A", "B"], "or" → "A or B"
 * - ["One"] → "One"
 *
 * Good for: "X, Y, and Z", choice labels, readable lists.
 */
export function formatList(
  items: string[],
  options?: { conjunction?: "and" | "or" },
): string {
  const { conjunction = "and" } = options ?? {};
  const list = items.filter(Boolean);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} ${conjunction} ${list[1]}`;
  const rest = list.slice(0, -1).join(", ");
  const last = list[list.length - 1];
  return `${rest} ${conjunction} ${last}`;
}

/**
 * Truncate string to max length with optional suffix
 *
 * Examples:
 * - truncate("Hello world", 8) → "Hello..."
 * - truncate("Hi", 10) → "Hi"
 * - truncate("Hello world", 8, "…") → "Hello w…"
 *
 * Good for: previews, titles, long text in fixed space.
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix = "...",
): string {
  if (typeof str !== "string" || maxLength < 0) return "";
  if (str.length <= maxLength) return str;
  if (suffix.length >= maxLength) return suffix.slice(0, maxLength);
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Format a range of values (e.g. numbers or dates)
 *
 * Examples:
 * - formatRange(1, 5) → "1 – 5"
 * - formatRange("Jan", "Mar") → "Jan – Mar"
 *
 * Good for: "Episode 1 – 10", date ranges, filters.
 */
export function formatRange(
  start: number | string,
  end: number | string,
  separator = " – ",
): string {
  return `${start}${separator}${end}`;
}

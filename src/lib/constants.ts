/**
 * Application Constants
 *
 * Centralized configuration values used across the application.
 * Includes file size limits, allowed formats, timing constants, and UI config.
 */
/** biome-ignore-all assist/source/organizeImports: preserve import grouping for dropzone component clarity */
import type { Accept } from 'react-dropzone';
import type { LucideIcon } from 'lucide-react';
import {
  FileSignature,
  Hash,
  Heading,
  MessageSquare,
  Target,
  Youtube,
} from 'lucide-react';

// File upload constraints
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit

/**
 * Allowed audio MIME types for upload validation
 *
 * Comprehensive list for cross-browser compatibility:
 * - Different browsers report different MIME types for same format
 * - Includes both standard and vendor-specific types
 * - Validated both client-side (dropzone) and server-side (API route)
 */
export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', // MP3 (standard)
  'audio/mp3', // MP3 (alternate)
  'audio/mp4', // M4A (standard)
  'audio/m4a', // M4A (alternate)
  'audio/x-m4a', // M4A (Apple)
  'audio/wav', // WAV (standard)
  'audio/x-wav', // WAV (Microsoft)
  'audio/wave', // WAV (alternate)
  'audio/aac', // AAC
  'audio/aacp', // AAC+
  'audio/ogg', // OGG Vorbis
  'audio/opus', // Opus
  'audio/webm', // WebM Audio
  'audio/flac', // FLAC (standard)
  'audio/x-flac', // FLAC (alternate)
  'audio/3gpp', // 3GP
  'audio/3gpp2', // 3G2
];

const MIME_EXTENSIONS: Record<string, string[]> = {
  'audio/mpeg': ['.mp3'],
  'audio/mp3': ['.mp3'],
  'audio/mp4': ['.m4a', '.mp4'],
  'audio/m4a': ['.m4a'],
  'audio/x-m4a': ['.m4a'],
  'audio/wav': ['.wav', '.wave'],
  'audio/x-wav': ['.wav', '.wave'],
  'audio/wave': ['.wav', '.wave'],
  'audio/aac': ['.aac'],
  'audio/aacp': ['.aac'],
  'audio/ogg': ['.ogg', '.oga'],
  'audio/opus': ['.opus'],
  'audio/webm': ['.webm'],
  'audio/flac': ['.flac'],
  'audio/x-flac': ['.flac'],
  'audio/3gpp': ['.3gp'],
  'audio/3gpp2': ['.3g2'],
};

/** Accept object for file inputs derived from ALLOWED_AUDIO_TYPES */
export const ACCEPT_AUDIO: Accept = Object.fromEntries(
  ALLOWED_AUDIO_TYPES.map((mime) => [mime, MIME_EXTENSIONS[mime] ?? []]),
) as Accept;

/**
 * Progress animation constants
 *
 * Used in processing flow for smooth progress indication:
 * - PROGRESS_CAP_PERCENTAGE: Stop at 95% until actual completion (UX best practice)
 * - ANIMATION_INTERVAL_MS: Speed of progress bar animation
 * - PROGRESS_UPDATE_INTERVAL_MS: How often to recalculate progress
 */
export const PROGRESS_CAP_PERCENTAGE = 95;
export const ANIMATION_INTERVAL_MS = 4000;
export const PROGRESS_UPDATE_INTERVAL_MS = 1000;

/**
 * Time conversion constants
 *
 * Used for duration formatting and time calculations
 */
export const MS_PER_MINUTE = 60000;
export const MS_PER_HOUR = MS_PER_MINUTE * 60;
export const MS_PER_DAY = MS_PER_HOUR * 24;

/**
 * UI configuration for generation outputs
 *
 * Defines the 6 AI generation tasks displayed during processing:
 * - id: Stable slug for keys, APIs, and analytics
 * - name: Display name for UI
 * - icon: Lucide icon component
 * - description: Benefit-focused copy for what the task delivers
 *
 * Used in ProcessingFlow component to show progress
 */
export interface GenerationOutput {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

export const GENERATION_OUTPUTS: GenerationOutput[] = [
  {
    id: 'summary',
    name: 'Summary',
    icon: FileSignature,
    description:
      'Distilling key insights, main points, and actionable takeaways from your episode',
  },
  {
    id: 'key-moments',
    name: 'Key Moments',
    icon: Target,
    description:
      'Pinpointing timestamps, highlights, and quotable moments for easy sharing and clips',
  },
  {
    id: 'social-posts',
    name: 'Social Posts',
    icon: MessageSquare,
    description:
      'Ready-to-publish captions for Twitter, LinkedIn, Instagram, TikTok, YouTube, and Facebook',
  },
  {
    id: 'titles',
    name: 'Titles',
    icon: Heading,
    description:
      'SEO-optimized titles and keywords designed to boost discoverability and clicks',
  },
  {
    id: 'hashtags',
    name: 'Hashtags',
    icon: Hash,
    description:
      'Platform-specific hashtag sets to expand reach and join relevant conversations',
  },
  {
    id: 'youtube-timestamps',
    name: 'YouTube Timestamps',
    icon: Youtube,
    description:
      'Clickable chapter markers formatted and ready for YouTube video descriptions',
  },
];

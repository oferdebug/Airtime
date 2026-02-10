/**
 * Convex Database Schema
 *
 * Defines the structure of all data stored in Convex for the AI Podcast Assistant.
 * Convex provides real-time reactivity, automatic TypeScript types, and ACID transactions.
 *
 * Architecture Overview:
 * - Centralized "projects" table containing all podcast processing data
 * - Denormalized design enables atomic updates and real-time UI synchronization
 * - Progressive data population as async jobs complete (transcription, script, audio)
 * - Granular job status tracking for precise user feedback
 *
 * Performance Optimizations:
 * - Indexes on userId, status, and createdAt for efficient querying
 * - Single-document structure minimizes join complexity
 * - Real-time subscriptions for instant UI updates
 *
 * Data Flow:
 * 1. User uploads audio → creates project with "uploading" status
 * 2. Inngest jobs process in stages → updates jobStatus fields incrementally
 * 3. Each completion updates specific fields (transcript, script, audioUrl)
 * 4. UI reactively displays progress via Convex subscriptions
 */

import {
  defineSchema,
  defineTable,
} from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  projects: defineTable({
    //NOTE - User Ownership
    userId: v.string(),

    //NOTE - Soft Delete Timestamp
    deletedAt: v.optional(v.number()),

    //NOTE - Input Field Metadata-Vercel Blob
    inputUrl: v.string(), //Vercel Blob URL
    fileName: v.string(), //Original Filename Displayed
    displayName: v.string(), //User Provided Display Name
    fileSize: v.string(), //Original File Size Displayed
    fileDuration: v.string(),
  }),
});

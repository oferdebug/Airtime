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

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    //NOTE - User Ownership
    userId: v.string(),

    //NOTE - Soft Delete Timestamp
    deletedAt: v.optional(v.number()),

    //NOTE - Orphaned Blob tracking (when blob delete fails after project soft-delete)
    orphanedBlob: v.optional(v.boolean()),
    orphanedBlobUrl: v.optional(v.string()),

    //NOTE - Input Field Metadata-Vercel Blob
    inputUrl: v.string(), //Vercel Blob URL
    fileName: v.string(), //Original Filename Displayed
    displayName: v.string(), //User Provided Display Name
    fileSize: v.number(), //Original File Size in bytes
    fileDuration: v.optional(v.number()), //Original File Duration in seconds
    fileFormat: v.string(), //Original File Format Displayed
    mimeType: v.string(), //Original File MimeType Displayed

    //NOTE - Job Status (upload/processing lifecycle)
    status: v.union(
      v.literal("pending"),
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),

    //NOTE - Granular Job Status Tracking System
    jobStatus: v.optional(
      v.object({
        transcription: v.optional(
          v.union(
            v.literal("pending"),
            v.literal("uploading"),
            v.literal("processing"),
            v.literal("completed"),
            v.literal("failed"),
          ),
        ),
        contentGeneration: v.optional(
          v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("completed"),
            v.literal("failed"),
          ),
        ),
      }),
    ),

    //NOTE - Error Tracking System
    error: v.optional(
      v.object({
        message: v.string(),
        step: v.string(),
        timestamp: v.number(),
        details: v.optional(
          v.object({
            statusCode: v.optional(v.number()),
            stack: v.optional(v.string()),
          }),
        ),
      }),
    ),

    //NOTE - Pre-Job Error Tracking
    jobErrors: v.optional(
      v.object({
        keyMoments: v.optional(v.string()),
        summary: v.optional(v.string()),
        socialPosts: v.optional(v.string()),
        titles: v.optional(v.string()),
        hashtags: v.optional(v.string()),
        youtubeTimestamps: v.optional(v.string()),
      }),
    ),

    //Transcript from AssemblyAI
    transcript: v.optional(
      v.object({
        text: v.string(), // Full transcript as plain text
        segments: v.array(
          v.object({
            id: v.number(),
            start: v.number(), //Start Time
            end: v.number(), //End Time
            text: v.string(), //Segment Text
            words: v.optional(
              v.array(
                v.object({
                  word: v.string(), //Word Text
                  start: v.number(), //Word Start Time
                  end: v.number(), //Word End Time
                }),
              ),
            ),
          }),
        ),

        //Speaker Diarization
        speakers: v.optional(
          v.array(
            v.object({
              speaker: v.string(), //Speaker Label
              start: v.number(),
              end: v.number(),
              text: v.string(),
              confidence: v.number(), //Detection Confidence
            }),
          ),
        ),

        //Auto Generated Chapters From AI
        chapters: v.optional(
          v.array(
            v.object({
              start: v.number(), //Start Time In Milliseconds
              end: v.number(), //End Time In Milliseconds
              headline: v.string(), //Chapter Headline
              summary: v.string(), //Chapter Summary
              gist: v.string(), //Short Gist Of The Chapter
            }),
          ),
        ),
      }),
    ),

    //Ai Generated Key Moments
    keyMoments: v.optional(
      v.array(
        v.object({
          time: v.string(), //Human-Readable Time
          timeStamp: v.number(), //Seconds For Programtic Use
          text: v.string(), //What Was Said In That Moment
          description: v.string(), //Why This Moment Is Important
        }),
      ),
    ),

    //Podcast Summary
    summary: v.optional(
      v.object({
        full: v.string(),
        bullets: v.array(v.string()),
        insights: v.array(v.string()),
        tldr: v.string(),
      }),
    ),

    //Platform Optimized Social Media Content Posts
    //Each Post Is Tailored Best Practiced Limits
    socialPosts: v.optional(
      v.object({
        twitter: v.string(), //200 Characters
        linkedin: v.string(), //Pro Tone&Longer Form
        instagram: v.string(), // Visual Description+Hooks
        tiktok: v.string(), //Casual
        youtube: v.string(), // Description With Timestamps And CTA
        facebook: v.string(), // Community Building Focus
      }),
    ),

    //Ai Generated Title Suggestion
    title: v.optional(
      v.object({
        youtubeShort: v.array(v.string()), // For YouTube Short Form Title
        youtubeLong: v.array(v.string()), // For YouTube Long Form Title
        podcastTitles: v.array(v.string()), // For Podcast Title
        seoKeywords: v.array(v.string()), //For SEO Discover
      }),
    ),

    //Platform Chapter Timestamps
    youtubeTimeStamps: v.optional(
      v.array(
        v.object({
          timeStamp: v.string(), //Human-Readable Time Format
          description: v.string(), // What Was Said In That Moment&Title
        }),
      ),
    ),

    //Timestamps Metdata
    createdAt: v.number(), //When The Project Was Created
    updatedAt: v.number(), //When The Project Was Updated
    completedAt: v.optional(v.number()), //When The Project Was Completed
  })

    //Indexes For Efficient Queries
    .index("by_user", ["userId"]) //List All Project For User
    .index("by_status", ["status"]) //List All Project For Status
    .index("by_user_and_status", ["userId", "status"]) //List All Project For User And Status
    .index("by_user_and_deleted_at", ["userId", "deletedAt"]) //List projects by user and soft-delete
    .index("by_created_at", ["createdAt"]) //List All Project For Created At
    .index("by_updated_at", ["updatedAt"]) //List All Project For Updated At
    .index("by_completed_at", ["completedAt"]), //List All Project For Completed At
});

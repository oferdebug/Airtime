import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// TODO: extend with inputUrl, status, file metadata – see docs/AIRTIME_ROADMAP.md Phase 1.1
export default defineSchema({
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    createdBy: v.optional(v.id("users")),
    /** Clerk user id for listing by current user when Convex users not synced. */
    userId: v.optional(v.string()),
    inputUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileDuration: v.optional(v.number()),
    fileFormat: v.optional(v.string()),
    mimeType: v.optional(v.string()),
  }).index("by_user_id", ["userId"]),
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
  }),
});

/**
 * Projects queries & mutations. See docs/AIRTIME_ROADMAP.md Phase 1.2.
 *
 * Inngest workflow: createProject -> podcast/uploaded -> updateProjectStatus,
 * saveTranscript, updateJobStatus, saveGeneratedContent, recordError
 */

import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProjectById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    if (!userId) return null;
    const project = await ctx.db.get(id);
    if (!project || project.userId !== userId) return null;
    if (project.deletedAt) return null;
    return project;
  },
});

/** Same as getProjectById but accepts { projectId } for server actions. */
export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    if (!userId) return null;
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return null;
    if (project.deletedAt) return null;
    return project;
  },
});

/**
 * Creates a new project record after file upload.
 * Called by server action after Vercel Blob upload succeeds.
 */
export const createProject = mutation({
  args: {
    userId: v.string(),
    inputUrl: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    fileDuration: v.optional(v.number()),
    fileFormat: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      userId: args.userId,
      inputUrl: args.inputUrl,
      fileName: args.fileName,
      displayName: args.fileName,
      fileSize: args.fileSize ?? 0,
      fileDuration: args.fileDuration ?? 0,
      fileFormat: args.fileFormat,
      mimeType: args.mimeType,
      status: "uploading",
      jobStatus: {
        transcription: "uploading",
        contentGeneration: "pending",
      },
      createdAt: now,
      updatedAt: now,
    });

    // Update user project count (or bootstrap from existing if counter missing)
    const existingCounter = await ctx.db
      .query("userProjectCounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (existingCounter) {
      await ctx.db.patch(existingCounter._id, {
        totalCount: existingCounter.totalCount + 1,
        activeCount: existingCounter.activeCount + 1,
      });
    } else {
      const existingProjects = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      const activeCount = existingProjects.filter((p) => !p.deletedAt).length;
      await ctx.db.insert("userProjectCounts", {
        userId: args.userId,
        totalCount: existingProjects.length + 1,
        activeCount: activeCount + 1,
      });
    }
    return projectId;
  },
});

/**
 * Updates the overall project status.
 * Called by Inngest workflow at key milestones.
 */
export const updateProjectStatus = mutation({
  args: {
    projectId: v.id("projects"),
    status: v.union(
      v.literal("pending"),
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    if (!userId || project.userId !== userId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    const updates: {
      status: typeof args.status;
      updatedAt: number;
      completedAt?: number;
    } = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }
    await ctx.db.patch(args.projectId, updates);
  },
});

/**
 * Saves the transcript from AssemblyAI.
 * Called by Inngest transcription step.
 */
export const saveTranscript = mutation({
  args: {
    projectId: v.id("projects"),
    transcript: v.object({
      text: v.string(),
      segments: v.array(
        v.object({
          id: v.number(),
          start: v.number(),
          end: v.number(),
          text: v.string(),
          words: v.optional(
            v.array(
              v.object({
                word: v.string(),
                start: v.number(),
                end: v.number(),
              }),
            ),
          ),
        }),
      ),
      speakers: v.optional(
        v.array(
          v.object({
            speaker: v.string(),
            start: v.number(),
            end: v.number(),
            text: v.string(),
            confidence: v.number(),
          }),
        ),
      ),
      chapters: v.optional(
        v.array(
          v.object({
            start: v.number(),
            end: v.number(),
            headline: v.string(),
            summary: v.string(),
            gist: v.string(),
          }),
        ),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    if (!userId || project.userId !== userId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    await ctx.db.patch(args.projectId, {
      transcript: args.transcript,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Updates job status for transcription or content generation phases.
 * Called by Inngest workflow.
 */
export const updateJobStatus = mutation({
  args: {
    projectId: v.id("projects"),
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
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    const identity = await ctx.auth.getUserIdentity();
    const callerId = identity?.subject;
    if (!callerId || project.userId !== callerId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    const updates = {
      jobStatus: {
        ...project.jobStatus,
        ...(args.transcription != null && {
          transcription: args.transcription,
        }),
        ...(args.contentGeneration != null && {
          contentGeneration: args.contentGeneration,
        }),
      },
      updatedAt: Date.now(),
    };
    await ctx.db.patch(args.projectId, updates);
  },
});

/**
 * Saves all AI-generated content in a single atomic operation.
 * Called by Inngest after all parallel AI jobs complete.
 */
export const saveGeneratedContent = mutation({
  args: {
    projectId: v.id("projects"),
    keyMoments: v.optional(
      v.array(
        v.object({
          time: v.string(),
          timestamp: v.number(),
          text: v.string(),
          description: v.string(),
        }),
      ),
    ),
    summary: v.optional(
      v.object({
        full: v.string(),
        bullets: v.array(v.string()),
        insights: v.array(v.string()),
        tldr: v.string(),
      }),
    ),
    socialPosts: v.optional(
      v.object({
        twitter: v.string(),
        linkedin: v.string(),
        instagram: v.string(),
        tiktok: v.string(),
        youtube: v.string(),
        facebook: v.string(),
      }),
    ),
    title: v.optional(
      v.object({
        youtubeShort: v.array(v.string()),
        youtubeLong: v.array(v.string()),
        podcastTitles: v.array(v.string()),
        seoKeywords: v.array(v.string()),
      }),
    ),
    youtubeTimeStamps: v.optional(
      v.array(
        v.object({
          timestamp: v.string(),
          description: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { projectId, ...content } = args;
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");
    const identity = await ctx.auth.getUserIdentity();
    const callerId = identity?.subject;
    if (!callerId || project.userId !== callerId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    await ctx.db.patch(projectId, {
      ...content,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Records an error when processing fails.
 * Called by Inngest step functions on exception.
 */
export const recordError = mutation({
  args: {
    projectId: v.id("projects"),
    message: v.string(),
    step: v.string(),
    details: v.optional(
      v.object({
        statusCode: v.optional(v.number()),
        stack: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    const identity = await ctx.auth.getUserIdentity();
    const callerId = identity?.subject;
    if (!callerId || project.userId !== callerId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    await ctx.db.patch(args.projectId, {
      status: "failed",
      error: {
        message: args.message,
        step: args.step,
        timestamp: Date.now(),
        details: args.details,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Saves errors for individual generation jobs.
 * Called by Inngest when generation steps fail.
 */
export const saveJobErrors = mutation({
  args: {
    projectId: v.id("projects"),
    jobErrors: v.object({
      keyMoments: v.optional(v.string()),
      summary: v.optional(v.string()),
      socialPosts: v.optional(v.string()),
      titles: v.optional(v.string()),
      hashtags: v.optional(v.string()),
      youtubeTimestamps: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    const identity = await ctx.auth.getUserIdentity();
    const callerId = identity?.subject;
    if (!callerId || project.userId !== callerId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    await ctx.db.patch(args.projectId, {
      jobErrors: args.jobErrors,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Lists all projects for a user with pagination.
 * Excludes soft-deleted projects.
 */
export const listUserProjects = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId || authUserId !== args.userId) {
      throw new Error("Unauthorized: You can only list your own projects");
    }
    const dbQuery = ctx.db
      .query("projects")
      .withIndex("by_user_and_deleted_at", (q) =>
        q.eq("userId", args.userId).eq("deletedAt", undefined),
      )
      .order("desc");
    return await dbQuery.paginate(args.paginationOpts);
  },
});

/**
 * Gets project count for a user (for quota enforcement).
 * includeDeleted=true: count all projects ever; includeDeleted=false: active only.
 */
export const getUserProjectCount = query({
  args: {
    userId: v.string(),
    includeDeleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    if (!userId || userId !== args.userId) {
      throw new Error("Unauthorized: You can only get your own project count");
    }
    const counter = await ctx.db
      .query("userProjectCounts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (counter) {
      return args.includeDeleted ? counter.totalCount : counter.activeCount;
    }
    // Fallback for users without counter (pre-deploy projects): one-time collect
    if (args.includeDeleted) {
      const all = await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      return all.length;
    }
    const active = await ctx.db
      .query("projects")
      .withIndex("by_user_and_deleted_at", (q) =>
        q.eq("userId", args.userId).eq("deletedAt", undefined),
      )
      .collect();
    return active.length;
  },
});

/**
 * Records an orphaned blob when Vercel Blob deletion fails after project soft-delete.
 * Used for scheduled cleanup jobs to retry blob deletion.
 */
export const recordOrphanedBlob = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    orphanedBlobUrl: v.string(),
    error: v.string(),
  },
  handler: async (ctx, { projectId, userId, orphanedBlobUrl, error }) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId || authUserId !== userId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    await ctx.db.patch(projectId, {
      orphanedBlob: true,
      orphanedBlobUrl,
      updatedAt: Date.now(),
    });
    console.warn("[ORPHANED_BLOB] Recorded for cleanup:", {
      projectId,
      userId,
      orphanedBlobUrl,
      error,
    });
  },
});

/**
 * Soft-deletes a project. Returns inputUrl for Blob cleanup.
 */
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId || authUserId !== userId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== authUserId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    await ctx.db.patch(projectId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
    const counter = await ctx.db
      .query("userProjectCounts")
      .withIndex("by_user", (q) => q.eq("userId", authUserId))
      .first();
    if (counter && counter.activeCount > 0) {
      await ctx.db.patch(counter._id, {
        activeCount: counter.activeCount - 1,
      });
    }
    return { inputUrl: project.inputUrl };
  },
});

/**
 * Updates the display name of a project.
 */
export const updateProjectDisplayName = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, { projectId, userId, displayName }) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId || authUserId !== userId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== authUserId) {
      throw new Error("Not authorized to update this project");
    }
    await ctx.db.patch(projectId, {
      displayName: displayName.trim(),
      updatedAt: Date.now(),
    });
  },
});

/** @deprecated Schema has no description field. Kept for compatibility. */
export const updateProjectDescription = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    description: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Not authorized to update this project");
    }
    console.warn(
      "[DEPRECATED] updateProjectDescription is deprecated (schema has no description field). projectId:",
      projectId,
      "userId:",
      userId,
    );
    // Schema has no description field; no-op
  },
});

export const updateProjectInputUrl = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    inputUrl: v.string(),
  },
  handler: async (ctx, { projectId, userId, inputUrl }) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId || authUserId !== userId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== authUserId) {
      throw new Error("Not authorized to update this project");
    }
    await ctx.db.patch(projectId, { inputUrl, updatedAt: Date.now() });
  },
});

export const updateProjectFileName = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    fileName: v.string(),
  },
  handler: async (ctx, { projectId, userId, fileName }) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId || authUserId !== userId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== authUserId) {
      throw new Error("Not authorized to update this project");
    }
    await ctx.db.patch(projectId, { fileName, updatedAt: Date.now() });
  },
});

export const updateProjectFileSize = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, { projectId, userId, fileSize }) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId || authUserId !== userId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== authUserId) {
      throw new Error("Not authorized to update this project");
    }
    await ctx.db.patch(projectId, { fileSize, updatedAt: Date.now() });
  },
});

export const updateProjectFileDuration = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    fileDuration: v.number(),
  },
  handler: async (ctx, { projectId, userId, fileDuration }) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId || authUserId !== userId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== authUserId) {
      throw new Error("Not authorized to update this project");
    }
    await ctx.db.patch(projectId, { fileDuration, updatedAt: Date.now() });
  },
});

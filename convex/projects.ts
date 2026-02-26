/**
 * Projects queries & mutations. See docs/AIRTIME_ROADMAP.md Phase 1.2.
 *
 * Inngest workflow: createProject -> podcast/uploaded -> updateProjectStatus,
 * saveTranscript, updateJobStatus, saveGeneratedContent, recordError
 */

import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { MutationCtx } from './_generated/server';
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';

export const getProjectById = query({
  args: { id: v.id('projects') },
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
  args: { projectId: v.id('projects') },
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
 * Idempotent helper: ensure userProjectCounts exists for userId and increment.
 * Registry is tracked per user to avoid a singleton write hotspot.
 */
async function ensureAndIncrementCounter(
  ctx: MutationCtx,
  userId: string,
  delta: { total: number; active: number },
) {
  const countUserProjects = async () => {
    let totalCount = 0;
    let activeCount = 0;
    let cursor: string | null = null;

    while (true) {
      const page = await ctx.db
        .query('projects')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .paginate({ numItems: 100, cursor });

      totalCount += page.page.length;
      activeCount += page.page.filter((project) => !project.deletedAt).length;

      if (page.isDone) {
        break;
      }
      cursor = page.continueCursor;
    }

    return { totalCount, activeCount };
  };

  const registry = await ctx.db
    .query('userProjectCountsRegistry')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();

  const counter = await ctx.db
    .query('userProjectCounts')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();

  if (registry && counter) {
    await ctx.db.patch(counter._id, {
      totalCount: counter.totalCount + delta.total,
      activeCount: counter.activeCount + delta.active,
    });
    return;
  }

  const projectCounts = await countUserProjects();
  const totalCount = projectCounts.totalCount + delta.total;
  const activeCount = projectCounts.activeCount + delta.active;

  if (counter) {
    await ctx.db.patch(counter._id, { totalCount, activeCount });
  } else {
    await ctx.db.insert('userProjectCounts', {
      userId,
      totalCount,
      activeCount,
    });
  }

  if (!registry) {
    await ctx.db.insert('userProjectCountsRegistry', {
      userId,
      initializedAt: Date.now(),
    });
  }
}

/**
 * One-time seed: create per-user registry docs from existing counters.
 * Run: npx convex run projects:seedUserProjectCountsRegistry
 */
export const seedUserProjectCountsRegistry = internalMutation({
  args: {},
  handler: async (ctx) => {
    const counters = await ctx.db.query('userProjectCounts').collect();
    let seededUsers = 0;

    for (const counter of counters) {
      const existing = await ctx.db
        .query('userProjectCountsRegistry')
        .withIndex('by_user', (q) => q.eq('userId', counter.userId))
        .first();
      if (existing) continue;

      await ctx.db.insert('userProjectCountsRegistry', {
        userId: counter.userId,
        initializedAt: Date.now(),
      });
      seededUsers += 1;
    }

    return {
      seededUsers,
      totalUsers: counters.length,
    };
  },
});

/**
 * Creates a new project record after file upload.
 * Called by server action after Vercel Blob upload succeeds.
 * Requires authenticated user; userId must match caller.
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
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId) {
      throw new Error(
        'Unauthorized: You must be signed in to create a project',
      );
    }
    if (authUserId !== args.userId) {
      throw new Error(
        'Unauthorized: You cannot create projects for another user',
      );
    }

    const now = Date.now();
    const projectId = await ctx.db.insert('projects', {
      userId: authUserId,
      inputUrl: args.inputUrl,
      fileName: args.fileName,
      displayName: args.fileName,
      fileSize: args.fileSize,
      fileDuration: args.fileDuration,
      fileFormat: args.fileFormat,
      mimeType: args.mimeType,
      status: 'uploading',
      jobStatus: {
        transcription: 'uploading',
        contentGeneration: 'pending',
      },
      createdAt: now,
      updatedAt: now,
    });

    await ensureAndIncrementCounter(ctx, authUserId, { total: 1, active: 1 });
    return projectId;
  },
});

/**
 * Updates the overall project status.
 * Called by Inngest workflow at key milestones.
 */
export const updateProjectStatus = mutation({
  args: {
    projectId: v.id('projects'),
    systemUserId: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('uploading'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed'),
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject ?? args.systemUserId;
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
    if (args.status === 'completed') {
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
    projectId: v.id('projects'),
    systemUserId: v.optional(v.string()),
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
    if (!project) throw new Error('Project not found');
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject ?? args.systemUserId;
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
    projectId: v.id('projects'),
    systemUserId: v.optional(v.string()),
    transcription: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('uploading'),
        v.literal('processing'),
        v.literal('completed'),
        v.literal('failed'),
      ),
    ),
    contentGeneration: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('running'),
        v.literal('completed'),
        v.literal('failed'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');
    const identity = await ctx.auth.getUserIdentity();
    const callerId = identity?.subject ?? args.systemUserId;
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
    projectId: v.id('projects'),
    systemUserId: v.optional(v.string()),
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
    hashtags: v.optional(v.array(v.string())),
    title: v.optional(
      v.object({
        youtubeShort: v.array(v.string()),
        youtubeLong: v.array(v.string()),
        podcastTitles: v.array(v.string()),
        seoKeywords: v.array(v.string()),
      }),
    ),
    youtubeTimestamps: v.optional(
      v.array(
        v.object({
          timestamp: v.string(),
          description: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Keep auth fallback input out of persisted project fields.
    const { projectId, systemUserId, ...content } = args;
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error('Project not found');
    const identity = await ctx.auth.getUserIdentity();
    const callerId = identity?.subject ?? systemUserId;
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
    projectId: v.id('projects'),
    systemUserId: v.optional(v.string()),
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
    if (!project) throw new Error('Project not found');
    const identity = await ctx.auth.getUserIdentity();
    const callerId = identity?.subject ?? args.systemUserId;
    if (!callerId || project.userId !== callerId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    await ctx.db.patch(args.projectId, {
      status: 'failed',
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
    projectId: v.id('projects'),
    systemUserId: v.optional(v.string()),
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
    if (!project) throw new Error('Project not found');
    const identity = await ctx.auth.getUserIdentity();
    const callerId = identity?.subject ?? args.systemUserId;
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
    paginationOpts: v.object({
      // usePaginatedQuery sends null for the first request cursor
      cursor: v.union(v.string(), v.null()),
      // Convex client may include pagination id metadata
      id: v.optional(v.number()),
      numItems: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId || authUserId !== args.userId) {
      throw new Error('Unauthorized: You can only list your own projects');
    }
    const dbQuery = ctx.db
      .query('projects')
      .withIndex('by_user_and_deleted_at', (q) =>
        q.eq('userId', args.userId).eq('deletedAt', undefined),
      )
      .order('desc');
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
      throw new Error('Unauthorized: You can only get your own project count');
    }
    const counter = await ctx.db
      .query('userProjectCounts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
    if (counter) {
      return args.includeDeleted ? counter.totalCount : counter.activeCount;
    }
    // No counter: either new user (0 projects) or pre-deploy user needing backfill.
    // Return 0 to avoid expensive collect; run backfillProjectCounters to initialize.
    console.warn({
      message:
        '[MISSING_PROJECT_COUNTER] missing project counter, backfill needed',
      userId: args.userId,
      includeDeleted: args.includeDeleted,
      query: 'getUserProjectCount',
      remediation: 'run backfillProjectCounters',
    });
    return 0;
  },
});

/**
 * Internal helper query for backfill orchestration.
 * Reads a bounded project page so each transaction stays small.
 */
export const getProjectBackfillPage = internalQuery({
  args: {
    cursor: v.union(v.string(), v.null()),
    numItems: v.number(),
  },
  handler: async (ctx, { cursor, numItems }) => {
    const result = await ctx.db
      .query('projects')
      .order('asc')
      .paginate({ numItems, cursor });

    return {
      page: result.page.map((project) => ({
        userId: project.userId,
        deletedAt: project.deletedAt,
      })),
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

/**
 * Batch upsert helper for backfill writes.
 * Called from backfillProjectCounters action in bounded user chunks.
 */
export const upsertUserProjectCounts = internalMutation({
  args: {
    counts: v.array(
      v.object({
        userId: v.string(),
        total: v.number(),
        active: v.number(),
      }),
    ),
  },
  handler: async (ctx, { counts }) => {
    for (const { userId, total, active } of counts) {
      const existing = await ctx.db
        .query('userProjectCounts')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          totalCount: total,
          activeCount: active,
        });
      } else {
        await ctx.db.insert('userProjectCounts', {
          userId,
          totalCount: total,
          activeCount: active,
        });
      }
    }
    return { usersUpserted: counts.length };
  },
});

/**
 * One-time backfill: scans projects and computes per-user counts, then upserts in chunks.
 * Run from Convex dashboard for users who had projects before the counter existed.
 * Uses action orchestration so reads/writes are split across multiple transactions.
 */
export const backfillProjectCounters = action({
  args: {},
  handler: async (ctx) => {
    const countsByUser = new Map<string, { total: number; active: number }>();

    const projectPageSize = 200;
    const userChunkSize = 500;
    let cursor: string | null = null;
    let processedProjects = 0;

    while (true) {
      const pageResult: {
        page: Array<{ userId: string; deletedAt?: number }>;
        continueCursor: string;
        isDone: boolean;
      } = await ctx.runQuery(internal.projects.getProjectBackfillPage, {
        cursor,
        numItems: projectPageSize,
      });
      const batch = pageResult.page;

      if (batch.length === 0) break;

      for (const p of batch) {
        const uid = p.userId;
        const curr = countsByUser.get(uid) ?? { total: 0, active: 0 };
        curr.total += 1;
        if (!p.deletedAt) curr.active += 1;
        countsByUser.set(uid, curr);
      }

      processedProjects += batch.length;
      cursor = pageResult.continueCursor;
      if (batch.length < projectPageSize || pageResult.isDone) break;
    }

    const userCounts = Array.from(countsByUser.entries()).map(
      ([userId, counts]) => ({
        userId,
        total: counts.total,
        active: counts.active,
      }),
    );

    let chunksProcessed = 0;
    for (let i = 0; i < userCounts.length; i += userChunkSize) {
      const chunk = userCounts.slice(i, i + userChunkSize);
      if (chunk.length === 0) continue;

      await ctx.runMutation(internal.projects.upsertUserProjectCounts, {
        counts: chunk,
      });
      chunksProcessed += 1;
    }

    return {
      usersBackfilled: countsByUser.size,
      processedProjects,
      chunksProcessed,
      userChunkSize,
    };
  },
});

/**
 * Records an orphaned blob when Vercel Blob deletion fails after project soft-delete.
 * Used for scheduled cleanup jobs to retry blob deletion.
 */
export const recordOrphanedBlob = mutation({
  args: {
    projectId: v.id('projects'),
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
    if (!project) throw new Error('Project not found');
    if (project.userId !== authUserId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    await ctx.db.patch(projectId, {
      orphanedBlob: true,
      orphanedBlobUrl,
      updatedAt: Date.now(),
    });
    console.warn('[ORPHANED_BLOB] Recorded for cleanup:', {
      projectId,
      userId,
      orphanedBlobUrl,
      error,
    });
  },
});

/**
 * Soft-deletes a project and decrements the active project counter.
 * Returns inputUrl for blob cleanup by caller.
 */
export const deleteProject = mutation({
  args: {
    projectId: v.id('projects'),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId || authUserId !== userId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error('Project not found');
    if (project.userId !== authUserId) {
      throw new Error("Unauthorized: You don't own this project");
    }
    if (project.deletedAt) {
      return { inputUrl: project.inputUrl };
    }
    await ctx.db.patch(projectId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
    const counter = await ctx.db
      .query('userProjectCounts')
      .withIndex('by_user', (q) => q.eq('userId', authUserId))
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
    projectId: v.id('projects'),
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
    if (!project) throw new Error('Project not found');
    if (project.userId !== authUserId) {
      throw new Error('Not authorized to update this project');
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
    projectId: v.id('projects'),
    userId: v.string(),
    description: v.string(),
  },
  handler: async (ctx, { projectId }) => {
    const identity = await ctx.auth.getUserIdentity();
    const authUserId = identity?.subject;
    if (!authUserId) {
      throw new Error('Unauthorized: You must be signed in');
    }
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== authUserId) {
      throw new Error('Not authorized to update this project');
    }
    console.warn(
      '[DEPRECATED] updateProjectDescription is deprecated (schema has no description field). projectId:',
      projectId,
    );
    // Schema has no description field; no-op
  },
});

export const updateProjectInputUrl = mutation({
  args: {
    projectId: v.id('projects'),
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
      throw new Error('Not authorized to update this project');
    }
    await ctx.db.patch(projectId, { inputUrl, updatedAt: Date.now() });
  },
});

export const updateProjectFileName = mutation({
  args: {
    projectId: v.id('projects'),
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
      throw new Error('Not authorized to update this project');
    }
    await ctx.db.patch(projectId, { fileName, updatedAt: Date.now() });
  },
});

export const updateProjectFileSize = mutation({
  args: {
    projectId: v.id('projects'),
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
      throw new Error('Not authorized to update this project');
    }
    await ctx.db.patch(projectId, { fileSize, updatedAt: Date.now() });
  },
});

export const updateProjectFileDuration = mutation({
  args: {
    projectId: v.id('projects'),
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
      throw new Error('Not authorized to update this project');
    }
    await ctx.db.patch(projectId, { fileDuration, updatedAt: Date.now() });
  },
});

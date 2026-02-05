/**
 * Projects queries & mutations. See docs/AIRTIME_ROADMAP.md Phase 1.2.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProjectById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const createProjects = mutation({
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
    return await ctx.db.insert("projects", {
      name: args.fileName,
      description: "",
      userId: args.userId,
      inputUrl: args.inputUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileDuration: args.fileDuration,
      fileFormat: args.fileFormat,
      mimeType: args.mimeType,
    });
  },
});

export const deleteProjects = mutation({
  args: { projectId: v.id("projects"), userId: v.string() },
  handler: async (ctx, { projectId, userId }) => {
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return null;
    const inputUrl = project.inputUrl ?? undefined;
    await ctx.db.delete(projectId);
    return { inputUrl };
  },
});

export const updateProjectDisplayName = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, { projectId, userId, displayName }) => {
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return;
    await ctx.db.patch(projectId, { name: displayName });
  },
});

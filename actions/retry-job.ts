"use server";

import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";
import { inngest } from "@/app/api/inngest/client";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

/**
 * Server action: retry a failed or locked AI generation step.
 *
 * - Retries a single failed generation step for the current user.
 * - On plan upgrade: regenerates outputs that were previously locked.
 * - Dispatches an Inngest event to regenerate only that step’s output.
 */

export type RetryableJob =
  | "keyMoments"
  | "socialPosts"
  | "titles"
  | "hashtags"
  | "youtubeTimestamps";

export async function retryJob(projectId: Id<"projects">, job: RetryableJob) {
  const authObj = await auth();
  const { userId, has } = authObj;

  if (!userId) {
    throw new Error("Unauthorized, You Must Be Logged In To Retry A Job");
  }

  /** Check if the user has a valid plan */
  let currentPlan: "free" | "pro" | "ultra" = "free";
  if (has?.({ plan: "ultra" })) {
    currentPlan = "ultra";
  } else if (has?.({ plan: "pro" })) {
    currentPlan = "pro";
  }

  /** Check if the project exists */
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL is required");
  const convex = new ConvexHttpClient(convexUrl);
  const project = await convex.query(
    (api as { projects: { getProject: FunctionReference<"query", "public"> } })
      .projects.getProject,
    { projectId },
  );

  if (!project) {
    throw new Error("Project not found or access denied");
  }

  /** Infer Original Plan from the Job Type That Was Generated */
  let originalPlan: "free" | "pro" | "ultra" = "free";
  // Map retryable jobs to the minimum plan that could have generated them (aligned with generate-missing-features plan features).
  if (job === "youtubeTimestamps" || job === "keyMoments") {
    originalPlan = "ultra";
  } else if (job === "socialPosts" || job === "titles" || job === "hashtags") {
    originalPlan = "pro";
  }
  // Trigger Inngest event to retry the specific job
  // Pass both original and current plans to detect upgrades
  await inngest.send({
    name: "podcast/retry-job",
    data: {
      projectId,
      job,
      userId,
      originalPlan,
      currentPlan,
    },
  });

  return { success: true };
}

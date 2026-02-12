"use server";

import { auth } from "@clerk/nextjs/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { ConvexHttpClient } from "convex/browser";
import { inngest } from "@/app/api/inngest/client";
import type { RetryableJob } from "./retry-job";

// Local configuration for plan features and their corresponding job keys.
type PlanName = "free" | "pro" | "ultra";

type FeatureName =
  | "summary"
  | "transcription"
  | "socialPosts"
  | "titles"
  | "hashtags"
  | "keyMoments"
  | "youtubeTimestamps";

const FREE_FEATURES: FeatureName[] = ["summary"];
const PRO_FEATURES: FeatureName[] = [
  ...FREE_FEATURES,
  "socialPosts",
  "titles",
  "hashtags",
];
const ULTRA_FEATURES: FeatureName[] = [
  ...PRO_FEATURES,
  "keyMoments",
  "youtubeTimestamps",
  "transcription",
];

const PLAN_FEATURES: Record<PlanName, FeatureName[]> = {
  free: FREE_FEATURES,
  pro: PRO_FEATURES,
  ultra: ULTRA_FEATURES,
};

const FEATURE_TO_JOB_MAP: Record<FeatureName, string | undefined> = {
  summary: undefined, // summary is always present / not a retryable job
  transcription: undefined, // transcription is not treated as a feature job here
  socialPosts: "socialPosts",
  titles: "titles",
  hashtags: "hashtags",
  keyMoments: "keyMoments",
  youtubeTimestamps: "youtubeTimestamps",
};

/**
 * Server Action: Generate All Missing Features After Upgrade
 *
 * When a user upgrades their plan, this action triggers generation of ALL
 * features available in their new plan that weren't generated when the project
 * was processed on their old plan.
 *
 * Example: User had Free plan (only Summary), upgrades to Pro.
 * This will generate: Social Posts, Titles, Hashtags all at once.
 *
 * Note: Transcription is NOT a feature - it's available to all users.
 */

/**
 * Generate all missing features for user's current plan
 *
 * Determines which features are available in current plan but missing from project,
 * then triggers parallel Inngest jobs to generate them all at once.
 */

export async function generateMissingFeatures(projectId: Id<"projects">) {
  const authObj = await auth();
  const { userId, has } = authObj;

  if (!userId) {
    throw new Error(
      "Unauthorized, You Must Be Logged In To Generate Missing Features",
    );
  }

  /** Check if the user has a valid plan */
  let currentPlan: "free" | "pro" | "ultra" = "free";
  if (has?.({ plan: "ultra" })) {
    currentPlan = "ultra";
  } else if (has?.({ plan: "pro" })) {
    currentPlan = "pro";
  }

  /** Check if the project exists & generated */
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is required");
  }
  const convex = new ConvexHttpClient(convexUrl);
  const project = await convex.query(api.projects.getProject, { projectId });

  if (!project) {
    throw new Error("Project not found or access denied");
  }

  if (project.userId !== userId) {
    throw new Error(
      "You are not authorized to generate missing features for this project",
    );
  }

  // Infer what plan was used during processing based on generated features
  let originalPlan: "free" | "pro" | "ultra" = "free";
  if (project.keyMoments || project.youtubeTimeStamps) {
    originalPlan = "ultra";
  } else if (project.socialPosts || project.title) {
    originalPlan = "pro";
  }

  /** Get All Features Available In Current Plan But Missing From Project */
  const avaliableFeatures = PLAN_FEATURES[currentPlan];

  const missingJobs: RetryableJob[] = [];
  // Check which features are available but not yet generated
  for (const feature of avaliableFeatures) {
    const jobName =
      FEATURE_TO_JOB_MAP[feature as keyof typeof FEATURE_TO_JOB_MAP];
    if (!jobName) continue; // Skip transcription and summary (always present)

    // Check if this data exists in the project
    const hasData = Boolean(project[jobName as keyof typeof project]);

    if (!hasData) {
      missingJobs.push(jobName as RetryableJob);
    }
  }

  if (missingJobs.length === 0) {
    throw new Error(
      "No missing features to generate. All features for your plan are already available.",
    );
  }

  // Trigger Inngest jobs for all missing features in parallel
  await Promise.all(
    missingJobs.map((job) =>
      inngest.send({
        name: "podcast/retry-job",
        data: {
          projectId,
          job,
          userId,
          originalPlan,
          currentPlan,
        },
      }),
    ),
  );

  return {
    success: true,
    generated: missingJobs,
    message: `Generating ${missingJobs.length} feature${
      missingJobs.length > 1 ? "s" : ""
    }: ${missingJobs.join(", ")}`,
  };
}

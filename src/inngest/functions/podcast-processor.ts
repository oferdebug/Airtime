import { api } from '@convex/_generated/api';
import type { AssemblyTranscript } from '@/lib/assemblyai';
import { transcribeWithAssemblyAI } from '@/lib/assemblyai';
import { getConvex } from '@/lib/convex-client';
import type { PlanName } from '@/lib/tier-config';
import { inngest } from '../client';

type GeneratedContent = {
  keyMoments: {
    time: string;
    timestamp: number;
    text: string;
    description: string;
  }[];
  summary: {
    full: string;
    bullets: string[];
    insights: string[];
    tldr: string;
  };
  socialPosts: {
    twitter: string;
    linkedin: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    facebook: string;
  };
  hashtags: string[];
  youtubeTimestamps: {
    timestamp: string;
    description: string;
  }[];
  title: {
    youtubeShort: string[];
    youtubeLong: string[];
    podcastTitles: string[];
    seoKeywords: string[];
  };
};

type JobErrorKey =
  | 'summary'
  | 'socialPosts'
  | 'titles'
  | 'hashtags'
  | 'keyMoments'
  | 'youtubeTimestamps';

type JobSpec = {
  key: JobErrorKey;
  run: () => Promise<unknown>;
};

function generateSummary(
  transcript: AssemblyTranscript,
): GeneratedContent['summary'] {
  const fullText = transcript.text || '';
  const tldr =
    fullText.length > 240 ? `${fullText.slice(0, 237).trimEnd()}...` : fullText;

  return {
    full: fullText,
    bullets: [],
    insights: [],
    tldr,
  };
}

function generateSocialPosts(
  summary: GeneratedContent['summary'],
): GeneratedContent['socialPosts'] {
  const preview = summary.tldr || summary.full || '';
  return {
    twitter: preview,
    linkedin: preview,
    instagram: preview,
    tiktok: preview,
    youtube: preview,
    facebook: preview,
  };
}

function generateTitles(
  summary: GeneratedContent['summary'],
): GeneratedContent['title'] {
  const seed = summary.tldr || summary.full || 'Podcast episode';
  return {
    youtubeShort: [seed.slice(0, 80)],
    youtubeLong: [seed.slice(0, 120)],
    podcastTitles: [seed.slice(0, 100)],
    seoKeywords: [],
  };
}

function generateHashtags(): GeneratedContent['hashtags'] {
  return [];
}

function generateKeyMoments(
  transcript: AssemblyTranscript,
): GeneratedContent['keyMoments'] {
  return transcript.segments.slice(0, 5).map((segment) => ({
    time: `${Math.floor(segment.start / 1000)}s`,
    timestamp: segment.start,
    text: segment.text,
    description: segment.text,
  }));
}

function generateYouTubeTimestamps(
  transcript: AssemblyTranscript,
): GeneratedContent['youtubeTimestamps'] {
  return transcript.segments.slice(0, 10).map((segment) => ({
    timestamp: `${Math.floor(segment.start / 1000)}s`,
    description: segment.text,
  }));
}

function buildJobs(plan: PlanName, transcript: AssemblyTranscript): JobSpec[] {
  const summary = generateSummary(transcript);
  const jobs: JobSpec[] = [
    {
      key: 'summary',
      run: async () => summary,
    },
  ];

  if (plan === 'pro' || plan === 'ultra') {
    jobs.push(
      { key: 'socialPosts', run: async () => generateSocialPosts(summary) },
      { key: 'titles', run: async () => generateTitles(summary) },
      { key: 'hashtags', run: async () => generateHashtags() },
    );
  }

  if (plan === 'ultra') {
    jobs.push(
      { key: 'keyMoments', run: async () => generateKeyMoments(transcript) },
      {
        key: 'youtubeTimestamps',
        run: async () => generateYouTubeTimestamps(transcript),
      },
    );
  }

  return jobs;
}

export const podcastProcessor = inngest.createFunction(
  {
    id: 'podcast-processor',
    optimizeParallelism: true,
    retries: 3,
  },
  { event: 'podcast/uploaded' },
  async ({ event, step }) => {
    const { projectId, fileUrl, plan: userPlan, userId } = event.data;
    const plan = (userPlan as PlanName) || 'free';
    const systemUserId = userId;
    const convex = getConvex();

    console.log(`Processing project ${projectId} for user ${plan} plan`);

    try {
      await step.run('update-project-status', async () => {
        await convex.mutation(api.projects.updateProjectStatus, {
          projectId,
          systemUserId,
          status: 'processing',
        });
      });

      await step.run('update-job-status-transcription', async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          systemUserId,
          transcription: 'processing',
        });
      });

      const transcript = await step.run('generate-transcription', () =>
        transcribeWithAssemblyAI(fileUrl),
      );

      await step.run('save-transcription', async () => {
        await convex.mutation(api.projects.saveTranscript, {
          projectId,
          systemUserId,
          transcript,
        });
      });

      await step.run('update-job-status-generation-running', async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          systemUserId,
          contentGeneration: 'running',
        });
      });

      // Build plan-gated generation jobs, then execute them in parallel as durable steps.
      const jobs = buildJobs(plan, transcript);
      const results = await Promise.allSettled(
        jobs.map((job) =>
          step.run(`generate-${job.key}`, async () => {
            const value = await job.run();
            return { key: job.key, value };
          }),
        ),
      );
      const generatedContent: Partial<GeneratedContent> = {};
      const jobErrors: Partial<Record<JobErrorKey, string>> = {};

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          const { key, value } = result.value;
          if (key === 'titles') {
            generatedContent.title = value as GeneratedContent['title'];
          } else {
            generatedContent[key] = value as never;
          }
          return;
        }

        const failedJob = jobs[idx];
        const errorMessage =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        jobErrors[failedJob.key] = errorMessage;
        console.error(
          `[podcast-processor] Failed to generate ${failedJob.key}`,
          {
            projectId,
            error: result.reason,
          },
        );
      });

      // Persist partial success so one failed generator doesn't discard the rest.
      if (Object.keys(generatedContent).length > 0) {
        await step.run('save-generated-content', async () => {
          await convex.mutation(api.projects.saveGeneratedContent, {
            projectId,
            systemUserId,
            ...generatedContent,
          });
        });
      }

      if (Object.keys(jobErrors).length > 0) {
        await step.run('save-job-errors', async () => {
          await convex.mutation(api.projects.saveJobErrors, {
            projectId,
            systemUserId,
            jobErrors,
          });
        });
      }

      await step.run('update-job-status-generation-completed', async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          systemUserId,
          contentGeneration: 'completed',
        });
      });

      await step.run('update-project-status-completed', async () => {
        await convex.mutation(api.projects.updateProjectStatus, {
          projectId,
          systemUserId,
          status: 'completed',
        });
      });

      return { ok: true, projectId, plan };
    } catch (error) {
      console.error('[podcast-processor] Failed to process podcast', {
        projectId,
        error,
      });

      try {
        await step.run('record-workflow-error', async () => {
          await convex.mutation(api.projects.recordError, {
            projectId,
            systemUserId,
            message:
              error instanceof Error ? error.message : 'Unknown error occurred',
            step: 'podcast-processor',
            details: {
              stack:
                error instanceof Error
                  ? error.stack
                  : JSON.stringify(error, null, 2),
            },
          });
        });

        await step.run('update-project-status-failed', async () => {
          await convex.mutation(api.projects.updateProjectStatus, {
            projectId,
            systemUserId,
            status: 'failed',
          });
        });
      } catch (statusError) {
        console.error(
          '[podcast-processor] Failed to update failed status',
          statusError,
        );
      }

      throw error;
    }
  },
);

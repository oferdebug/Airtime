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
  titles: {
    youtubeShort: string[];
    youtubeLong: string[];
    podcastTitles: string[];
    seoKeywords: string[];
  };
};

type JobErrorKey =
  | 'transcript'
  | 'summary'
  | 'socialPosts'
  | 'titles'
  | 'hashtags'
  | 'keyMoments'
  | 'youtubeTimestamps'
  | 'general';

type JobSpec = {
  key: JobErrorKey;
  run: () => Promise<unknown>;
};

function formatYouTubeTimestamp(totalSeconds: number): string {
  const normalizedSeconds = Math.floor(totalSeconds);
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const seconds = normalizedSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

const SUMMARY_MODEL = process.env.OPENAI_SUMMARY_MODEL ?? 'gpt-4o-mini';
const OPENAI_CHAT_COMPLETIONS_URL =
  'https://api.openai.com/v1/chat/completions';

function buildFallbackTldr(fullText: string): string {
  return fullText.length > 240
    ? `${fullText.slice(0, 237).trimEnd()}...`
    : fullText;
}

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type SummaryExtraction = {
  bullets: string[];
  insights: string[];
  tldr?: string;
};

function extractSummaryLists(content: string): SummaryExtraction {
  const cleanContent = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    const parsed = JSON.parse(cleanContent) as {
      bullets?: unknown;
      insights?: unknown;
      tldr?: unknown;
    };

    const bullets = Array.isArray(parsed.bullets)
      ? parsed.bullets.filter(
          (item): item is string => typeof item === 'string',
        )
      : [];
    const insights = Array.isArray(parsed.insights)
      ? parsed.insights.filter(
          (item): item is string => typeof item === 'string',
        )
      : [];

    return {
      bullets,
      insights,
      tldr: typeof parsed.tldr === 'string' ? parsed.tldr : undefined,
    };
  } catch {
    const lines = cleanContent
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const bullets: string[] = [];
    const insights: string[] = [];
    let currentSection: 'bullets' | 'insights' | null = null;

    for (const line of lines) {
      const normalized = line.toLowerCase();
      if (normalized.startsWith('bullets:')) {
        currentSection = 'bullets';
        continue;
      }
      if (normalized.startsWith('insights:')) {
        currentSection = 'insights';
        continue;
      }

      const item = line.replace(/^[-*]\s*/, '').trim();
      if (!item) continue;
      if (currentSection === 'insights') {
        insights.push(item);
      } else {
        bullets.push(item);
      }
    }

    return { bullets, insights };
  }
}

async function requestSummaryFromModel(
  fullText: string,
): Promise<SummaryExtraction | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      '[podcast-processor] OPENAI_API_KEY is not set; using fallback summary lists',
    );
    return null;
  }

  const prompt = [
    'You are summarizing a podcast transcript.',
    'Return JSON with keys: bullets (array of 3-6 concise bullet strings), insights (array of 3-6 deeper insights), tldr (one sentence).',
    'Focus on clarity and specific takeaways. Do not include markdown fences.',
    '',
    fullText,
  ].join('\n');

  const OPENAI_REQUEST_TIMEOUT_MS = 60_000;

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    OPENAI_REQUEST_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SUMMARY_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You produce concise, factual podcast summaries as valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OpenAI request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Summary model request failed (${response.status}): ${body}`,
    );
  }

  const payload = (await response.json()) as OpenAiChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content;

  if (!content || typeof content !== 'string') {
    throw new Error('Summary model returned empty content');
  }

  return extractSummaryLists(content);
}

async function generateSummary(
  fullText: string,
): Promise<GeneratedContent['summary']> {
  const normalizedText = fullText || '';
  const fallbackTldr = buildFallbackTldr(normalizedText);

  if (!normalizedText.trim()) {
    return {
      full: normalizedText,
      bullets: [],
      insights: [],
      tldr: fallbackTldr,
    };
  }

  try {
    const extracted = await requestSummaryFromModel(normalizedText);
    return {
      full: normalizedText,
      bullets: extracted?.bullets ?? [],
      insights: extracted?.insights ?? [],
      tldr: extracted?.tldr?.trim() || fallbackTldr,
    };
  } catch (error) {
    console.error('[podcast-processor] Failed to generate AI summary lists', {
      error,
    });
    return {
      full: normalizedText,
      bullets: [],
      insights: [],
      tldr: fallbackTldr,
    };
  }
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
): GeneratedContent['titles'] {
  const seed = summary.tldr || summary.full || 'Podcast episode';
  return {
    youtubeShort: [seed.slice(0, 80)],
    youtubeLong: [seed.slice(0, 120)],
    podcastTitles: [seed.slice(0, 100)],
    // TODO: Replace placeholder SEO keywords with AI keyword generation.
    seoKeywords: [],
  };
}

function generateHashtags(): GeneratedContent['hashtags'] {
  // TODO: Replace placeholder hashtags with AI-generated hashtag suggestions.
  return [];
}

function generateKeyMoments(
  transcript: AssemblyTranscript,
): GeneratedContent['keyMoments'] {
  return transcript.segments.slice(0, 5).map((segment) => ({
    time: `${Math.floor(segment.start / 1000)}s`,
    timestamp: Math.floor(segment.start / 1000),
    text: segment.text,
    description: segment.text,
  }));
}

function generateYouTubeTimestamps(
  transcript: AssemblyTranscript,
): GeneratedContent['youtubeTimestamps'] {
  return transcript.segments.slice(0, 10).map((segment) => ({
    timestamp: formatYouTubeTimestamp(Math.floor(segment.start / 1000)),
    description: segment.text,
  }));
}

function buildJobs(plan: PlanName, transcript: AssemblyTranscript): JobSpec[] {
  let summaryCache: Promise<GeneratedContent['summary']> | null = null;
  const getSummary = () => {
    if (summaryCache === null) {
      summaryCache = generateSummary(transcript.text || '');
    }
    return summaryCache;
  };

  const jobs: JobSpec[] = [
    {
      key: 'summary',
      run: async () => await getSummary(),
    },
  ];

  if (plan === 'pro' || plan === 'ultra') {
    jobs.push(
      {
        key: 'socialPosts',
        run: async () => generateSocialPosts(await getSummary()),
      },
      { key: 'titles', run: async () => generateTitles(await getSummary()) },
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

function getErrorKey(activeStepLabel: string): JobErrorKey {
  const exactMatches: Partial<Record<string, JobErrorKey>> = {
    'generate-transcription': 'transcript',
    'save-transcription': 'transcript',
    'update-job-status-transcription': 'transcript',
  };
  const exactMatch = exactMatches[activeStepLabel];
  if (exactMatch) return exactMatch;

  const prefixMap: Array<[string, JobErrorKey]> = [
    ['generate-summary', 'summary'],
    ['generate-socialPosts', 'socialPosts'],
    ['generate-titles', 'titles'],
    ['generate-hashtags', 'hashtags'],
    ['generate-keyMoments', 'keyMoments'],
    ['generate-youtubeTimestamps', 'youtubeTimestamps'],
  ];
  for (const [prefix, key] of prefixMap) {
    if (activeStepLabel.startsWith(prefix)) return key;
  }

  console.warn(
    '[podcast-processor] Unmatched step label for error key mapping',
    {
      activeStepLabel,
      knownPrefixes: prefixMap.map(([prefix]) => prefix),
    },
  );

  return 'general';
}

export const podcastProcessor = inngest.createFunction(
  {
    id: 'podcast-processor',
    optimizeParallelism: true,
    retries: 3,
  },
  { event: 'podcast/uploaded' },
  async ({ event, step }) => {
    let activeStepLabel = 'init';
    if (!event.data || typeof event.data !== 'object') {
      throw new Error('[podcast-processor] Missing event data');
    }

    const projectId =
      typeof event.data.projectId === 'string' && event.data.projectId.trim()
        ? event.data.projectId
        : null;
    const fileUrl =
      typeof event.data.fileUrl === 'string' && event.data.fileUrl.trim()
        ? event.data.fileUrl
        : null;
    const userId =
      typeof event.data.userId === 'string' && event.data.userId.trim()
        ? event.data.userId
        : null;

    if (!projectId || !fileUrl || !userId) {
      throw new Error(
        '[podcast-processor] Missing required event fields: projectId, fileUrl, or userId',
      );
    }

    const userPlan = event.data.plan;
    const plan: PlanName =
      userPlan === 'free' || userPlan === 'pro' || userPlan === 'ultra'
        ? userPlan
        : 'free';
    const systemUserId = userId;
    const convex = getConvex();

    console.log(`Processing project ${projectId} for user on the ${plan} plan`);

    try {
      activeStepLabel = 'update-project-status';
      await step.run('update-project-status', async () => {
        await convex.mutation(api.projects.updateProjectStatus, {
          projectId,
          systemUserId,
          status: 'processing',
        });
      });

      activeStepLabel = 'update-job-status-transcription';
      await step.run('update-job-status-transcription', async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          systemUserId,
          transcription: 'processing',
        });
      });

      activeStepLabel = 'generate-transcription';
      const transcript = await step.run('generate-transcription', () =>
        transcribeWithAssemblyAI(fileUrl),
      );

      activeStepLabel = 'save-transcription';
      await step.run('save-transcription', async () => {
        await convex.mutation(api.projects.saveTranscript, {
          projectId,
          systemUserId,
          transcript,
        });
      });

      activeStepLabel = 'update-job-status-generation-running';
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
          switch (key) {
            case 'summary':
              generatedContent.summary = value as GeneratedContent['summary'];
              break;
            case 'socialPosts':
              generatedContent.socialPosts =
                value as GeneratedContent['socialPosts'];
              break;
            case 'titles':
              generatedContent.titles = value as GeneratedContent['titles'];
              break;
            case 'hashtags':
              generatedContent.hashtags = value as GeneratedContent['hashtags'];
              break;
            case 'keyMoments':
              generatedContent.keyMoments =
                value as GeneratedContent['keyMoments'];
              break;
            case 'youtubeTimestamps':
              generatedContent.youtubeTimestamps =
                value as GeneratedContent['youtubeTimestamps'];
              break;
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
        activeStepLabel = 'save-generated-content';
        await step.run('save-generated-content', async () => {
          await convex.mutation(api.projects.saveGeneratedContent, {
            projectId,
            systemUserId,
            ...generatedContent,
          });
        });
      }

      if (Object.keys(jobErrors).length > 0) {
        activeStepLabel = 'save-job-errors';
        await step.run('save-job-errors', async () => {
          await convex.mutation(api.projects.saveJobErrors, {
            projectId,
            systemUserId,
            jobErrors,
          });
        });
      }

      activeStepLabel = 'update-job-status-generation-completed';
      await step.run('update-job-status-generation-completed', async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          systemUserId,
          contentGeneration: 'completed',
        });
      });

      activeStepLabel = 'update-project-status-completed';
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
        const errorKey = getErrorKey(activeStepLabel);
        await step.run('save-job-error', async () => {
          await convex.mutation(api.projects.saveJobErrors, {
            projectId,
            systemUserId,
            jobErrors: {
              [errorKey]:
                error instanceof Error
                  ? error.message
                  : `Workflow failed at ${activeStepLabel}`,
            },
          });
        });
        await step.run('record-error', async () => {
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






/**
 * Episode created Inngest handler.
 *
 * Current implementation advances project status to avoid indefinite "stuck"
 * UI states in local/dev while full transcription/content generation is wired.
 */
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { getConvex } from '@/lib/convex-client';
import { inngest } from '../client';

const DEV_PLACEHOLDER_EXPIRATION = '2026-03-31';
const DEV_PLACEHOLDER_TICKET = 'ENG-2026-DEV-RETRY-PLACEHOLDER';

function assertDevPlaceholderNotExpired() {
  if (process.env.ALLOW_EXPIRED_DEV_PLACEHOLDERS === 'true') return;
  if (Date.now() <= Date.parse(DEV_PLACEHOLDER_EXPIRATION)) return;
  throw new Error(
    `[podcast-retry-job] Dev placeholders expired (${DEV_PLACEHOLDER_TICKET}) on ${DEV_PLACEHOLDER_EXPIRATION}`,
  );
}

async function parseProjectId(
  data: unknown,
  convex: ReturnType<typeof getConvex>,
): Promise<Id<'projects'>> {
  if (!data || typeof data !== 'object') {
    throw new Error('[podcast-retry-job] Missing event data');
  }

  const projectId = (data as { projectId?: unknown }).projectId;
  if (typeof projectId !== 'string' || projectId.trim().length === 0) {
    throw new Error('[podcast-retry-job] Invalid projectId in event data');
  }
  const normalizedId = await convex.query(api.projects.normalizeProjectId, {
    projectId: projectId.trim(),
  });
  if (!normalizedId) {
    throw new Error(
      '[podcast-retry-job] Invalid projectId format in event data (expected Convex id)',
    );
  }

  return normalizedId as Id<'projects'>;
}

export const podcastRetryJob = inngest.createFunction(
  { id: 'podcast-retry-job' },
  { event: 'podcast/retry-job' },
  async ({ event, step }) => {
    const convex = getConvex();
    const projectId = await step.run('parse-project-id', async () => parseProjectId(event.data, convex));
    const systemUserId =
      event.data && typeof event.data.userId === 'string'
        ? event.data.userId
        : undefined;

    if (!systemUserId) {
      console.error('[podcast-retry-job] Missing userId in event data', {
        projectId,
        data: event.data,
      });
      throw new Error('[podcast-retry-job] Missing userId in event data');
    }

    try {
      await step.run('set-project-processing', async () => {
        await convex.mutation(api.projects.updateProjectStatus, {
          projectId,
          status: 'processing',
          systemUserId,
        });
      });

      await step.run('set-transcription-processing', async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          transcription: 'processing',
          systemUserId,
        });
      });

      await step.run('wait-for-transcription', async () => {
        // TODO(ENG-2026-DEV-RETRY-PLACEHOLDER, target 2026-03-31):
        // Replace this dev-only placeholder with transcription readiness polling or event-driven waiting.
        assertDevPlaceholderNotExpired();
        return true;
      });
      // TODO(ENG-2026-DEV-RETRY-PLACEHOLDER, target 2026-03-31):
      // Remove simulated sleep once real transcription orchestration is wired.
      await step.sleep('simulate-transcription', '2s');

      await step.run('set-transcription-completed', async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          transcription: 'completed',
          contentGeneration: 'running',
          systemUserId,
        });
      });

      await step.run('wait-for-content-generation', async () => {
        // TODO(ENG-2026-DEV-RETRY-PLACEHOLDER, target 2026-03-31):
        // Replace this dev-only placeholder with real content-generation orchestration.
        assertDevPlaceholderNotExpired();
        return true;
      });
      // TODO(ENG-2026-DEV-RETRY-PLACEHOLDER, target 2026-03-31):
      // Remove simulated sleep once generation orchestration is event-driven.
      await step.sleep('simulate-generation', '2s');

      await step.run('set-content-completed', async () => {
        await convex.mutation(api.projects.updateJobStatus, {
          projectId,
          contentGeneration: 'completed',
          systemUserId,
        });
      });

      await step.run('set-project-completed', async () => {
        await convex.mutation(api.projects.updateProjectStatus, {
          projectId,
          status: 'completed',
          systemUserId,
        });
      });

      return { ok: true, projectId };
    } catch (error) {
      const originalError = error;
      console.error('[podcast-retry-job] Failed to process uploaded podcast', {
        projectId,
        error: originalError,
      });

      try {
        await step.run('set-project-failed', async () => {
          await convex.mutation(api.projects.updateProjectStatus, {
            projectId,
            status: 'failed',
            systemUserId,
          });
        });
      } catch (statusError) {
        console.error('[podcast-retry-job] Failed to process podcast and set failed status', {
          projectId,
          error: originalError,
          statusError,
        });
      }

      throw originalError;
    }
  },
);


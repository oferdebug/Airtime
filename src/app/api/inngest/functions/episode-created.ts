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

export const episodeCreated = inngest.createFunction(
  { id: 'episode-created' },
  { event: 'podcast/uploaded' },
  async ({ event, step }) => {
    const convex = getConvex();
    const projectId = event.data.projectId as Id<'projects'>;
    const systemUserId = event.data.userId;

    try {
      await convex.mutation(api.projects.updateProjectStatus, {
        projectId,
        status: 'processing',
        systemUserId,
      });

      await convex.mutation(api.projects.updateJobStatus, {
        projectId,
        transcription: 'processing',
        systemUserId,
      });

      await step.sleep('simulate-transcription', '2s');

      await convex.mutation(api.projects.updateJobStatus, {
        projectId,
        transcription: 'completed',
        contentGeneration: 'running',
        systemUserId,
      });

      await step.sleep('simulate-generation', '2s');

      await convex.mutation(api.projects.updateJobStatus, {
        projectId,
        contentGeneration: 'completed',
        systemUserId,
      });

      await convex.mutation(api.projects.updateProjectStatus, {
        projectId,
        status: 'completed',
        systemUserId,
      });

      return { ok: true, projectId };
    } catch (error) {
      try {
        await convex.mutation(api.projects.updateProjectStatus, {
          projectId,
          status: 'failed',
          systemUserId,
        });
      } catch (statusError) {
        console.error('[episode-created] Failed to set project failed status', {
          projectId,
          statusError,
        });
      }

      console.error('[episode-created] Failed to process uploaded podcast', {
        projectId,
        error,
      });
      throw error;
    }
  },
);

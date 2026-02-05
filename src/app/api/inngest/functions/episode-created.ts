/**
 * Episode created Inngest handler – placeholder until Phase 2/3.
 * See docs/AIRTIME_ROADMAP.md for implementation plan.
 */
import { inngest } from "../client";

export const episodeCreated = inngest.createFunction(
  { id: "episode-created" },
  { event: "podcast/uploaded" },
  async () => {
    return { ok: true };
  },
);

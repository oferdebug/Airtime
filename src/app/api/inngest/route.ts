import { serve } from 'inngest/next';
import { inngest } from './client';
import { helloWorld, podcastProcessor } from './functions';

// Create an API that serves the helloWorld and podcastProcessor functions.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld, podcastProcessor],
});

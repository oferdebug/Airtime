// inngest/functions.js or inngest/functions.ts
import { inngest } from '../client';

export const helloWorld = inngest.createFunction(
  { id: 'hello-world' }, // Configuration: unique ID
  { event: 'test/hello.world' }, // Trigger: event name
  async ({ event, step }) => {
    // Handler
    // You can use step.sleep() to make the function durable and retriable
    await step.sleep('wait-a-moment', '1s');

    // The function returns a value which is logged in the Inngest dashboard
    return {
      message: `Hello, World! Received email: ${event.data.email}`,
    };
  },
);

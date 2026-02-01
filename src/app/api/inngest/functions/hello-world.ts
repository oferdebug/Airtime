import { inngest } from "../client";

/** Raw payload shape; email may be absent or wrong type from external source. */
interface HelloWorldPayload {
  email?: unknown;
}

/**
 * Parses and validates email from the hello-world event payload.
 * Returns trimmed non-empty string or null if absent/invalid.
 */
function parseHelloWorldEmail(data: unknown): string | null {
  if (data === null || typeof data !== "object") return null;
  const obj = data as HelloWorldPayload;
  const raw = obj.email;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed === "") return null;
  // Basic email format check (adjust regex as needed)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
}

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    const email = parseHelloWorldEmail(event.data);
    if (email === null) {
      return { message: "Hello! (No email provided.)" };
    }
    return { message: `Hello ${email}!` };
  },
);

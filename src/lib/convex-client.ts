/**
 * Server-Side Convex Client
 *
 * HTTP client for calling Convex mutations and queries from server environments.
 * Used in:
 * - Next.js server actions
 * - API routes
 * - Inngest functions (background jobs)
 *
 * Singleton Pattern:
 * - One client instance shared across the application
 * - Reduces connection overhead
 * - Maintains consistent configuration
 *
 * Lazy Initialization:
 * - Client is created on first use to avoid throwing at import time during build
 * - Environment check happens when getConvex() is first called
 *
 * Why HTTP Client vs. React Client?
 * - React client (useQuery/useMutation) is for frontend only
 * - HTTP client works in Node.js (server actions, API routes, Inngest)
 * - HTTP client makes direct authenticated calls to Convex
 *
 * Authentication:
 * - Uses Convex deployment URL from environment
 * - Public mutations/queries are accessible
 * - Private functions require auth (handled by Convex)
 *
 * Environment Variables:
 * - NEXT_PUBLIC_CONVEX_URL: Convex deployment URL
 * - Must match frontend Convex provider configuration
 */

import { ConvexHttpClient } from 'convex/browser';

let _client: ConvexHttpClient | null = null;

/**
 * Get or create the Convex HTTP client instance (memoized).
 * Validates NEXT_PUBLIC_CONVEX_URL on first call.
 *
 * @throws Error if NEXT_PUBLIC_CONVEX_URL is missing or empty
 */
export function getConvex(): ConvexHttpClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url || url.trim() === '') {
    throw new Error(
      'NEXT_PUBLIC_CONVEX_URL is required. Set it in your environment.',
    );
  }
  _client = new ConvexHttpClient(url);
  return _client;
}

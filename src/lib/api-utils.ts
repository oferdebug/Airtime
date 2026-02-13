/**
 * API Utilities for Next.js Route Handlers
 *
 * Standard helpers for authentication, responses, and error handling in API routes.
 * These utilities ensure consistent behavior and error formats across all endpoints.
 *
 * Security & Feature Gating:
 * - Auth via Clerk; plan limits enforced here (defense-in-depth with upload route).
 * - Feature gating enforced via tier-utils.ts
 *
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Standardized API success response helper
 *
 * Returns NextResponse with JSON data and optional status code.
 * Default status is 200 (OK).
 *
 * @param data - Response payload (any type)
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with JSON body
 */

export function apiResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Standardized API error response helper
 *
 * Returns NextResponse with error message and status code.
 * Format: { error: string }
 *
 * @param message - Error message for client
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with error body
 */

export function apiError(
  message: string,
  status = 500,
): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Authentication wrapper for API routes
 *
 * Validates Clerk authentication and returns userId if authenticated.
 * Returns a discriminated union so handlers can return the response directly.
 *
 */

export async function withAuth(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, response: apiError("Unauthorized", 401) };
  }
  return { ok: true, userId };
}

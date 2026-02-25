# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Airtime** is an AI-powered podcast transcription platform built with Next.js 16 (App Router), Convex (real-time serverless backend), Clerk (auth + billing), Inngest (background jobs), and Vercel Blob (file storage).

### Services

| Service | Type | Notes |
|---------|------|-------|
| Next.js dev server | Local | `npx next dev` (port 3000) |
| Convex | Cloud SaaS | Runs via `npx convex dev` (needs `CONVEX_DEPLOYMENT` env var) |
| Clerk | Cloud SaaS | Auth provider — all routes require valid `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Inngest | Local/Cloud | Background jobs — dev server: `npx inngest-cli@latest dev` |
| Vercel Blob | Cloud SaaS | File storage for audio uploads |

### Key caveats

- **Clerk blocks all pages**: The root layout wraps everything in `ClerkProvider` and the middleware (`src/middleware.ts`) intercepts all non-static routes. Without a valid `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`, every page returns 500. You must have valid Clerk secrets to render any page.
- **Dev script splits Next.js and Convex**: The `pnpm dev` script runs `next dev &convex dev` (shell background `&`, not `&&`). To run Next.js alone without Convex, use `npx next dev` directly.
- **TypeScript compiles cleanly** with `npx tsc --noEmit`.
- **No Docker required** — all backend services are cloud SaaS.
- **pnpm build warnings**: Some build scripts are ignored (`esbuild`, `protobufjs`, `@clerk/shared`). These don't affect dev server operation but show warnings during `pnpm install`. The `pnpm-workspace.yaml` already lists `ignoredBuiltDependencies` for `sharp` and `unrs-resolver`.

### Commands reference

- **Install deps**: `pnpm install`
- **Dev server (Next.js only)**: `npx next dev`
- **Dev server (full)**: `pnpm dev` (Next.js + Convex)
- **Lint (ESLint)**: `pnpm lint`
- **Lint (Biome)**: `npx @biomejs/biome check .`
- **Type check**: `npx tsc --noEmit`
- **Build**: `pnpm build`

### Required environment variables

Copy `.env.example` to `.env.local` and fill in real values. See `.env.example` for the full list. The critical ones for rendering any page are the Clerk keys.

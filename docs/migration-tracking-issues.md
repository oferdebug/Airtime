# Migration Tracking Issues

## MIG-2026-001: Remove temporary project file metadata unions

- Status: Open
- Target date: 2026-03-15
- Scope:
  - `projects.fileSize: v.union(v.number(), v.string())`
  - `projects.fileDuration: v.optional(v.union(v.number(), v.string()))`
- Required completion criteria:
  - Run `projects:normalizeProjectFileMetadata` migration in all environments.
  - Verify no string values remain for `fileSize`/`fileDuration`.
  - Tighten schema to `v.number()` / `v.optional(v.number())`.
  - Regenerate Convex types and remove temporary coercion paths if no longer needed.

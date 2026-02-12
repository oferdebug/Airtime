"use client";

import { api } from "@convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import Link from "next/link";

export function ProjectsList({ userId }: { userId: string }) {
  const {
    results: projects,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.projects.listUserProjects,
    { userId },
    { initialNumItems: 20 },
  );

  if (status === "LoadingFirstPage") {
    return <p className="mt-5 text-stone-500">Loading projects...</p>;
  }

  if (!projects || projects.length === 0) {
    return (
      <p className="mt-5 text-stone-500">
        No projects yet. Upload a podcast to get started.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-5 space-y-4">
        {projects.map((project) => (
          <li key={project._id}>
            <Link
              href={`/dashboard/projects/${project._id}`}
              className="block rounded-lg border border-stone-200 bg-card p-4 transition-colors hover:bg-stone-50"
            >
              <h2 className="font-semibold text-foreground">
                {project.displayName ?? project.fileName ?? "Untitled"}
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                View project details
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {status === "CanLoadMore" && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => loadMore(20)}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-stone-50"
          >
            Load more
          </button>
        </div>
      )}
      {status === "LoadingMore" && (
        <p className="mt-4 text-center text-sm text-stone-500">
          Loading more...
        </p>
      )}
    </>
  );
}

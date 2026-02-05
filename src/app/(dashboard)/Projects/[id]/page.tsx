"use client";

import { useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { useParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

// Cast until Convex codegen runs (npx convex dev) and api.projects is in _generated/api.d.ts
const getProjectById = (
  api as {
    projects: {
      getProjectById: FunctionReference<
        "query",
        "public",
        { id: Id<"projects"> },
        unknown
      >;
    };
  }
).projects.getProjectById;

export default function ProjectDetailsPage() {
  const params = useParams();
  const rawId = params?.id;
  const projectId = (() => {
    if (rawId == null || rawId === "") return null;
    return (Array.isArray(rawId) ? rawId[0] : rawId) as Id<"projects">;
  })();
  const project = useQuery(
    getProjectById,
    projectId ? { id: projectId } : "skip",
  );

  if (!projectId) {
    return (
      <div className="p-8 min-h-screen">
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="mt-5 text-stone-500">No project ID provided.</p>
      </div>
    );
  }

  if (project === undefined) {
    return (
      <div className="p-8 min-h-screen">
        <p className="text-stone-600">Loading project...</p>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="p-8 min-h-screen">
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="mt-5 text-stone-500">This project does not exist or you do not have access.</p>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-2xl font-bold">Project Details</h1>
      <p className="mt-5 text-lg">
        Project ID From URL: <strong>{projectId}</strong>
      </p>
      <div className="mt-5 text-stone-500">
        If you see this, it means the project details are being fetched from the
        database.
        <pre className="mt-5 p-4 bg-stone-50 rounded-md text-sm">
          {JSON.stringify(project, null, 2)}
        </pre>
      </div>
    </div>
  );
}

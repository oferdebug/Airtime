import { auth } from "@clerk/nextjs/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";

export default async function ProjectsPage() {
  const authObj = await auth();
  const { userId } = authObj;
  if (!userId) {
    return (
      <div className="p-8 min-h-screen">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <p className="mt-5 text-stone-500">
          Please sign in to view your projects.
        </p>
      </div>
    );
  }

  let result: {
    page: Array<{
      _id: Id<"projects">;
      displayName?: string;
      fileName?: string;
    }>;
  };
  try {
    const token = await authObj.getToken({ template: "convex" });
    result = await fetchQuery(
      api.projects.listUserProjects,
      {
        userId,
        paginationOpts: { numItems: 50 },
      },
      { token: token ?? undefined },
    );
  } catch (err) {
    console.error("[Projects] Failed to load projects:", err);
    return (
      <div className="p-8 min-h-screen">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <p className="mt-5 text-destructive">
          Unable to load projects. Please try again later.
        </p>
      </div>
    );
  }

  const projects = result?.page ?? [];

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-2xl font-bold">My Projects</h1>
      {projects.length === 0 ? (
        <p className="mt-5 text-stone-500">
          No projects yet. Upload a podcast to get started.
        </p>
      ) : (
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
      )}
    </div>
  );
}

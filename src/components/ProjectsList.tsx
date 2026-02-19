'use client';

import { api } from '@convex/_generated/api';
import { usePaginatedQuery } from 'convex/react';
import { ChevronRight, Clock3, FileAudio2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatSmartDate } from '@/lib/format';
import { cn } from '@/lib/utils';

function formatDuration(duration?: number | string) {
  if (duration === undefined || duration === null) {
    return 'N/A';
  }
  const seconds =
    typeof duration === 'string' ? Number.parseFloat(duration) : duration;
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 'N/A';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

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

  if (status === 'LoadingFirstPage') {
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
        {projects.map((project) => {
          const title = project.displayName ?? project.fileName ?? 'Untitled';
          return (
            <li key={project._id}>
              <Link
                href={`/dashboard/projects/${project._id}`}
                className={cn(
                  'group block rounded-2xl border border-border bg-card/60 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg',
                  'dark:bg-card/40',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileAudio2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-foreground truncate">
                        {title}
                      </h2>
                      {project.fileName && project.fileName !== title ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {project.fileName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline" className="capitalize">
                    {STATUS_LABELS[project.status] ?? project.status}
                  </Badge>
                  <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    {formatDuration(project.fileDuration)}
                  </span>
                  <span className="text-muted-foreground">
                    {formatSmartDate(project.createdAt)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {status === 'CanLoadMore' && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => loadMore(20)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Load more
          </button>
        </div>
      )}
      {status === 'LoadingMore' && (
        <p className="mt-4 text-center text-sm text-stone-500">
          Loading more...
        </p>
      )}
    </>
  );
}

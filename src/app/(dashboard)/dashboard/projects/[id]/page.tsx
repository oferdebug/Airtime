"use client";

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileAudio,
  FileText,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDuration, formatFileSize } from "@/lib/utils";

// TODO: remove cast after running npx convex dev - api.projects.getProjectById should be in _generated/api.d.ts
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

type StepStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "running"
  | "completed"
  | "failed";

function mapToStepStatus(value: unknown): StepStatus {
  const valid: StepStatus[] = [
    "pending",
    "uploading",
    "processing",
    "running",
    "completed",
    "failed",
  ];
  return typeof value === "string" && valid.includes(value as StepStatus)
    ? (value as StepStatus)
    : "pending";
}

function computeOverallProgress(
  status: string,
  transcription: StepStatus,
  contentGen: StepStatus,
): number {
  if (status === "completed") return 100;
  if (status === "failed") return 0;
  if (transcription === "completed") {
    if (contentGen === "completed") return 100;
    if (contentGen === "running" || contentGen === "processing") return 75;
    return 50;
  }
  if (transcription === "processing" || transcription === "uploading")
    return 25;
  return 0;
}

function StepIndicator({
  status,
  label,
  icon: Icon,
}: {
  status: StepStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const config: Record<
    StepStatus,
    { icon: string; bg: string; label: string }
  > = {
    pending: {
      icon: "text-muted-foreground",
      bg: "bg-muted",
      label: "Pending",
    },
    uploading: {
      icon: "text-amber-600",
      bg: "bg-amber-100",
      label: "Uploading",
    },
    processing: {
      icon: "text-brand-600",
      bg: "bg-brand-100",
      label: "Processing",
    },
    running: {
      icon: "text-brand-600",
      bg: "bg-brand-100",
      label: "Running",
    },
    completed: {
      icon: "text-emerald-600",
      bg: "bg-emerald-100",
      label: "Completed",
    },
    failed: {
      icon: "text-red-600",
      bg: "bg-red-100",
      label: "Failed",
    },
  };

  const c = config[status] ?? config.pending;
  const isActive =
    status === "uploading" || status === "processing" || status === "running";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${c.bg}`}
      >
        {status === "completed" ? (
          <CheckCircle2 className={`h-5 w-5 ${c.icon}`} />
        ) : status === "failed" ? (
          <XCircle className={`h-5 w-5 ${c.icon}`} />
        ) : isActive ? (
          <Loader2 className={`h-5 w-5 animate-spin ${c.icon}`} />
        ) : (
          <Icon className={`h-5 w-5 ${c.icon}`} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{c.label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "completed"
      ? "default"
      : status === "failed"
        ? "destructive"
        : "secondary";

  const label =
    status === "uploading"
      ? "Uploading"
      : status === "processing"
        ? "Processing"
        : status === "completed"
          ? "Completed"
          : status === "failed"
            ? "Failed"
            : status;

  return <Badge variant={variant}>{label}</Badge>;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const rawId = params?.id;
  const projectId = (() => {
    const str = rawId == null ? "" : Array.isArray(rawId) ? rawId[0] : rawId;
    if (!str || typeof str !== "string" || str.trim() === "") return null;
    // Convex IDs are typically alphanumeric base64-like strings; basic format check
    if (!/^[a-zA-Z0-9_-]{10,}$/.test(str)) return null;
    return str as Id<"projects">;
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
        <Link
          href="/dashboard/projects"
          className="mt-6 inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  if (project === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="p-8 min-h-screen">
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="mt-5 text-stone-500">
          This project does not exist or you do not have access.
        </p>
        <Link
          href="/dashboard/projects"
          className="mt-6 inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  const proj = project as Doc<"projects">;
  const status = proj.status ?? "uploading";
  const jobStatus = proj.jobStatus ?? {};
  const transcription = mapToStepStatus(jobStatus.transcription);
  const contentGen = mapToStepStatus(jobStatus.contentGeneration);

  const fileSizeNum = Number(proj.fileSize);
  const fileDurationNum = Number(proj.fileDuration);

  const overallProgress = computeOverallProgress(
    status,
    transcription,
    contentGen,
  );

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>

        {/* Header card */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl truncate">
                {proj.displayName ?? proj.fileName}
              </CardTitle>
              <CardDescription className="mt-1">
                {proj.fileFormat?.toUpperCase() ?? "Audio"} •{" "}
                {Number.isFinite(fileSizeNum)
                  ? formatFileSize(fileSizeNum)
                  : proj.fileSize}{" "}
                •{" "}
                {Number.isFinite(fileDurationNum)
                  ? formatDuration(fileDurationNum)
                  : (proj.fileDuration ?? "—")}
              </CardDescription>
            </div>
            <StatusBadge status={status} />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">
                  Overall progress
                </span>
                <span className="font-semibold text-foreground">
                  {overallProgress}%
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Processing steps */}
        <Card>
          <CardHeader>
            <CardTitle>Processing steps</CardTitle>
            <CardDescription>
              Your podcast is being transcribed and analyzed by AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <StepIndicator
              status={transcription}
              label="Transcription"
              icon={FileAudio}
            />
            <StepIndicator
              status={contentGen}
              label="Content generation"
              icon={Sparkles}
            />
          </CardContent>
        </Card>

        {/* Error display */}
        {proj.error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" /> Processing error
              </CardTitle>
              <CardDescription>
                {proj.error.step && `Step: ${proj.error.step}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive">{proj.error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Audio player */}
        {proj.inputUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="h-5 w-5 text-brand-500" /> Audio
              </CardTitle>
              <CardDescription>Listen to your uploaded file</CardDescription>
            </CardHeader>
            <CardContent>
              {/* biome-ignore lint/a11y/useMediaCaption: track rendered conditionally when captionsUrl exists to avoid empty-track browser warnings */}
              <audio
                controls
                className="w-full"
                src={proj.inputUrl}
                preload="metadata"
                aria-label="Podcast audio"
              >
                {proj.captionsUrl && (
                  <track
                    kind="captions"
                    src={proj.captionsUrl}
                    srcLang="en"
                    label="English"
                  />
                )}
                Your browser does not support the audio element.
              </audio>
            </CardContent>
          </Card>
        )}

        {/* Preview content when available */}
        {(proj.summary || proj.transcript) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-500" /> Generated
                content
              </CardTitle>
              <CardDescription>
                Transcript and summary from your podcast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {proj.summary?.tldr && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    TL;DR
                  </p>
                  <p className="text-foreground">{proj.summary.tldr}</p>
                </div>
              )}
              {proj.summary?.bullets && proj.summary.bullets.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Key points
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-foreground">
                    {proj.summary.bullets.map((b: string, i: number) => (
                      <li key={`${i}-${b}`}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
              {proj.transcript?.text && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Transcript
                  </p>
                  <p className="text-foreground whitespace-pre-wrap line-clamp-6">
                    {proj.transcript.text}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

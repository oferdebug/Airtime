'use client';

import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Edit2, Loader2, Save, Trash2, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  deleteProjectAction,
  updateDisplayNameAction,
} from '@/app/actions/projects';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { ProcessingFlow } from '@/components/processing-flow';
import { TabContent } from '@/components/project-detail/tab-content';
import {
  DesktopTabTrigger,
  MobileTabItem,
} from '@/components/project-detail/tab-triggers';
import type { ProjectDetailData } from '@/components/project-detail/types';
import { ProjectStatusCard } from '@/components/project-status-card';
import { HashtagsTab } from '@/components/project-tabs/hashtags-tab';
import { KeyMomentsTab } from '@/components/project-tabs/key-moments-tab';
import { SocialPostsTab } from '@/components/project-tabs/social-posts-tab';
import { SummaryTab } from '@/components/project-tabs/summary-tab';
import { TitlesTab } from '@/components/project-tabs/titles-tab';
import { TranscriptTab } from '@/components/project-tabs/transcript-tab';
import { YouTubeTimestampsTab } from '@/components/project-tabs/youtube-timestamps-tab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { getFileDurationAsNumber } from '@/lib/project-metadata';
import { PROJECT_TABS } from '@/lib/tab-config';

function toProjectDetailData(
  project: Doc<'projects'> | null | undefined,
): ProjectDetailData | null | undefined {
  if (project == null) return project;
  return {
    ...project,
    fileDuration: getFileDurationAsNumber(project.fileDuration),
  };
}

export default function ProjectDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  // Convex document ids are alphanumeric and at least 11 chars; validate before casting.
  const isValidProjectIdParam =
    typeof id === 'string' && id.length > 10 && /^[a-zA-Z0-9]+$/.test(id);
  const projectId = isValidProjectIdParam ? (id as Id<'projects'>) : null;
  const rawProject = useQuery(
    api.projects.getProject,
    projectId ? { projectId } : 'skip',
  );
  const project = toProjectDetailData(rawProject);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const transcriptionStatus = project?.jobStatus?.transcription ?? 'pending';
  const generationStatus = project?.jobStatus?.contentGeneration ?? 'pending';

  const handleStartEdit = () => {
    setEditedName(project?.displayName || project?.fileName || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName('');
  };

  const handleSaveEdit = async () => {
    if (!projectId) {
      toast.error('Project not found');
      return;
    }

    if (!editedName.trim()) {
      toast.error('Project name could not be empty');
      return;
    }
    const trimmedName = editedName.trim();

    setIsSaving(true);
    try {
      const result = await updateDisplayNameAction(projectId, trimmedName);
      if (!result.success) {
        toast.error(result.error || 'Failed to update project name');
        return;
      }
      toast.success('Project Name Updated Successfully');
      setEditedName(trimmedName);
      setIsEditing(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update project name, please try again',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectId) {
      toast.error('Project not found');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteProjectAction(projectId);
      if (!result.success) {
        toast.error(result.error || 'Failed to delete project, please try again');
        return;
      }
      toast.success('Project Deleted Successfully');
      setIsDeleteDialogOpen(false);
      router.push('/dashboard/projects');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete project, please try again',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!projectId) {
    return (
      <div className="container max-w-7xl mx-auto py-10 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Project not found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (project === undefined) {
    return (
      <div className="container max-w-7xl mx-auto py-10 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container max-w-7xl mx-auto py-10 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Project not found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProcessing = project.status === 'processing';
  const isCompleted = project.status === 'completed';
  const hasFailed = project.status === 'failed';
  const showGenerating = isProcessing && generationStatus === 'running';

  return (
    <div className="container max-w-7xl mx-auto py-10 px-4">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(event) => setEditedName(event.target.value)}
                className="h-auto py-2 text-2xl font-bold"
                placeholder="Project name"
                autoFocus
                disabled={isSaving}
              />
              <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="wrap-break-word text-3xl font-bold tracking-tight">
                {project.displayName || project.fileName}
              </h1>
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-3">
          {!isEditing && (
            <Button variant="outline" size="lg" onClick={handleStartEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          <Button
            variant="destructive"
            size="lg"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete project?"
        description="Are you sure you want to delete this project? This action cannot be reversed."
        confirmText={isDeleting ? 'Deleting...' : 'Delete project'}
        cancelText="Cancel"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
      />

      <div className="grid gap-6">
        <ProjectStatusCard project={project} />

        {isProcessing && (
          <ProcessingFlow
            isProcessing={isProcessing}
            transcriptionStatus={transcriptionStatus}
            generationStatus={generationStatus}
            fileDuration={project.fileDuration}
            createdAt={project.createdAt}
          />
        )}

        {hasFailed && project.error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{project.error.message}</p>
              {project.error.step ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Failed at: {project.error.step}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}

        {showGenerating || isCompleted ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-0"
          >
            <div className="mb-6 rounded-xl border p-4 lg:hidden">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TABS.map((tab) => (
                    <MobileTabItem key={tab.value} tab={tab} />
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-6 hidden rounded-xl border p-2 lg:block">
              <TabsList className="flex h-auto w-full flex-wrap gap-2 bg-transparent">
                {PROJECT_TABS.map((tab) => (
                  <DesktopTabTrigger key={tab.value} tab={tab} />
                ))}
              </TabsList>
            </div>

            <TabsContent value="summary" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.summary}
                error={project.jobErrors?.summary}
                emptyMessage="No summary available"
              >
                <SummaryTab summary={project.summary} />
              </TabContent>
            </TabsContent>

            <TabsContent value="moments" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.keyMoments}
                error={project.jobErrors?.keyMoments}
                emptyMessage="No key moments detected"
              >
                <KeyMomentsTab keyMoments={project.keyMoments} />
              </TabContent>
            </TabsContent>

            <TabsContent value="youtube-timestamps" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.youtubeTimestamps}
                error={project.jobErrors?.youtubeTimestamps}
                emptyMessage="No YouTube timestamps available"
              >
                <YouTubeTimestampsTab timestamps={project.youtubeTimestamps} />
              </TabContent>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.socialPosts}
                error={project.jobErrors?.socialPosts}
                emptyMessage="No social posts available"
              >
                <SocialPostsTab socialPosts={project.socialPosts} />
              </TabContent>
            </TabsContent>

            <TabsContent value="hashtags" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.hashtags}
                error={project.jobErrors?.hashtags}
                emptyMessage="No hashtags available"
              >
                <HashtagsTab hashtags={project.hashtags} />
              </TabContent>
            </TabsContent>

            <TabsContent value="titles" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.titles}
                error={project.jobErrors?.titles}
                emptyMessage="No titles available"
              >
                <TitlesTab titles={project.titles} />
              </TabContent>
            </TabsContent>

            <TabsContent value="transcript" className="space-y-4">
              <TabContent
                isLoading={showGenerating}
                data={project.transcript}
                error={
                  transcriptionStatus === 'failed'
                    ? project.jobErrors?.transcript
                    : undefined
                }
                emptyMessage="No transcript available"
              >
                <TranscriptTab transcript={project.transcript} />
              </TabContent>
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </div>
  );
}



'use client';

import {
  deleteProjectAction,
  updateDisplayNameAction,
} from '@/app/actions/projects';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@clerk/nextjs';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Loader2, Save, XIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProjectDetailsPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  const projectId = typeof id === 'string' ? (id as Id<'projects'>) : null;
  const project = useQuery(
    api.projects.getProject,
    projectId ? { projectId } : 'skip',
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const transcriptionStatus = project?.jobStatus?.transcription || 'pending';
  const generationStatus = project?.jobStatus?.contentGeneration || 'pending';

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
      await updateDisplayNameAction(projectId, trimmedName);
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
      await deleteProjectAction(projectId);
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
            <p className="text-center text-muted-foreground">Project not found.</p>
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
            <p className="text-center text-muted-foreground">Project not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userId || project.userId !== userId) {
    return (
      <div className="container max-w-7xl mx-auto py-10 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You Don&apos;t Have Access To This Project
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
  const showTranscribing =
    isProcessing &&
    (transcriptionStatus === 'uploading' || transcriptionStatus === 'processing');

  return (
    <div className="container max-w-7xl mx-auto py-10 px-4 space-y-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-3">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="h-auto py-3 text-2xl font-bold"
                placeholder="Enter New Project Name"
                autoFocus
                disabled={isSaving}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
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
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1
                className={cn(
                  'text-3xl font-bold tracking-tight',
                  isProcessing && 'text-primary',
                )}
              >
                {project.displayName || project.fileName}
              </h1>
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartEdit}
                disabled={isSaving}
              >
                Edit
              </Button>
            </div>
          )}
        </div>
        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete Project'}
        </Button>
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

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="glass-card md:col-span-1">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="outline" className="capitalize">
                {project.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Created{" "}
              {new Date(project.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            {showTranscribing ? (
              <p className="text-sm text-primary">Transcribing audio...</p>
            ) : null}
            {showGenerating ? (
              <p className="text-sm text-primary">Generating content...</p>
            ) : null}
            {isCompleted ? (
              <p className="text-sm text-emerald-600">Project completed.</p>
            ) : null}
            {hasFailed ? (
              <p className="text-sm text-destructive">Project processing failed.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="glass-card md:col-span-2">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">Summary</h2>
            {project.summary?.tldr ? (
              <p className="text-sm text-foreground/90 leading-relaxed">
                {project.summary.tldr}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No summary generated yet.
              </p>
            )}

            <h3 className="text-sm font-semibold pt-2">Key Moments</h3>
            {project.keyMoments?.length ? (
              <ul className="space-y-2">
                {project.keyMoments.slice(0, 4).map((moment, idx) => (
                  <li key={`${moment.timestamp}-${idx}`} className="rounded-lg border border-border px-3 py-2">
                    <p className="text-xs text-muted-foreground">{moment.time}</p>
                    <p className="text-sm">{moment.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No key moments available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
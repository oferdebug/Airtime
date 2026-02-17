'use client';

import { ProjectsList } from '@/components/ProjectsList';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function ProjectsPage() {
  const { userId, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="container max-w-6xl mx-auto py-10 px-4">
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container max-w-6xl mx-auto py-10 px-4">
        <p className="text-muted-foreground">
          Please sign in to view projects.{" "}
          <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Podcast Library</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your podcast projects.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <ProjectsList userId={userId} />
      </div>
    </div>
  );
}

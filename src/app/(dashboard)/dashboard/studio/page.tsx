'use client';

import { useAuth } from '@clerk/nextjs';
import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import type { LucideIcon } from 'lucide-react';
import { Mic2, Sparkles, Wand2 } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PLAN_LIMITS } from '@/lib/tier-config';

interface StudioAction {
  title: string;
  description: string;
  icon: LucideIcon;
}

const studioActions: ReadonlyArray<StudioAction> = [
  {
    title: 'Generate Episode Summary',
    description: 'Create concise show notes and social-ready highlights.',
    icon: Wand2,
  },
  {
    title: 'Create Social Content',
    description: 'Produce platform-specific posts in one click.',
    icon: Sparkles,
  },
  {
    title: 'Draft Intro/Outro',
    description: 'Generate polished scripts for your next release.',
    icon: Mic2,
  },
];

export default function StudioPage() {
  const { userId, has } = useAuth();
  const activeProjectCount = useQuery(
    api.projects.getUserProjectCount,
    userId ? { userId, includeDeleted: false } : 'skip',
  );
  const plan = has?.({ plan: 'ultra' })
    ? 'ultra'
    : has?.({ plan: 'pro' })
      ? 'pro'
      : 'free';
  const maxProjects = PLAN_LIMITS[plan].maxProjects;

  const remainingGenerations = useMemo(() => {
    if (maxProjects === null) {
      return 'Unlimited';
    }
    if (typeof activeProjectCount !== 'number') {
      return '...';
    }
    return Math.max(0, maxProjects - activeProjectCount).toString();
  }, [activeProjectCount, maxProjects]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Studio</h1>
        <p className="text-muted-foreground mt-1">
          Use AI workflows to produce content from your episodes.
        </p>
      </div>

      <Card className="glass-card">
        <CardContent className="p-5 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Current plan usage</p>
            <p className="text-sm text-muted-foreground">
              You have {remainingGenerations} AI generations remaining on your
              current plan.
            </p>
          </div>
          <Badge>
            {remainingGenerations === 'Unlimited'
              ? 'Unlimited'
              : `${remainingGenerations} left`}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {studioActions.map((action) => {
          const Icon = action.icon;
          const comingSoonId = `studio-coming-soon-${action.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')}`;
          return (
            <Card key={action.title} className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-primary" />
                  {action.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
                <p id={comingSoonId} className="text-xs text-muted-foreground">
                  Coming soon
                </p>
                <Button
                  className="w-full"
                  disabled
                  title="Coming soon"
                  aria-label={`${action.title} is coming soon`}
                  aria-describedby={comingSoonId}
                >
                  Start
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

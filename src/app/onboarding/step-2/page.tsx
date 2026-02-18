'use client';

import { BellRing, Cable, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export default function OnboardingStepTwoPage() {
  const router = useRouter();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [enableMagicSearch, setEnableMagicSearch] = useState(true);
  const [autoSocialDrafts, setAutoSocialDrafts] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('airtime-onboarding-preferences');
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        emailNotifications?: unknown;
        enableMagicSearch?: unknown;
        autoSocialDrafts?: unknown;
      };
      if (typeof parsed.emailNotifications === 'boolean') {
        setEmailNotifications(parsed.emailNotifications);
      }
      if (typeof parsed.enableMagicSearch === 'boolean') {
        setEnableMagicSearch(parsed.enableMagicSearch);
      }
      if (typeof parsed.autoSocialDrafts === 'boolean') {
        setAutoSocialDrafts(parsed.autoSocialDrafts);
      }
    } catch {
      // Ignore malformed localStorage and keep defaults.
    }
  }, []);

  const handleFinish = async () => {
    localStorage.setItem(
      'airtime-onboarding-preferences',
      JSON.stringify({
        emailNotifications,
        enableMagicSearch,
        autoSocialDrafts,
      }),
    );
    router.push('/dashboard/welcome');
  };

  return (
    <main className="min-h-screen mesh-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-3xl glass-card-strong rounded-3xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Badge className="w-fit">Step 2 of 2</Badge>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary/50" />
              <span className="h-2 w-6 rounded-full bg-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Connect and Configure
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Enable optional features to finish your Airtime workspace setup.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <label
                htmlFor="email-notifications"
                className="font-medium flex items-center gap-2 cursor-pointer"
              >
                <BellRing className="h-4 w-4 text-primary" />
                Email notifications
              </label>
              <p className="text-sm text-muted-foreground">
                Receive updates for completed AI generation jobs.
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <label
                htmlFor="magic-search"
                className="font-medium flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                Enable Magic Search
              </label>
              <p className="text-sm text-muted-foreground">
                Search your episode library with semantic AI prompts.
              </p>
            </div>
            <Switch
              id="magic-search"
              checked={enableMagicSearch}
              onCheckedChange={setEnableMagicSearch}
            />
          </div>

          <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <label
                htmlFor="auto-social-drafts"
                className="font-medium flex items-center gap-2 cursor-pointer"
              >
                <Cable className="h-4 w-4 text-primary" />
                Auto social drafts
              </label>
              <p className="text-sm text-muted-foreground">
                Generate social media drafts after each processed episode.
              </p>
            </div>
            <Switch
              id="auto-social-drafts"
              checked={autoSocialDrafts}
              onCheckedChange={setAutoSocialDrafts}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button asChild variant="ghost">
              <Link href="/onboarding/step-1">Back</Link>
            </Button>
            <Button onClick={handleFinish}>Finish setup</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

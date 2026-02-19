'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const SETTINGS_STORAGE_KEY = 'airtime.dashboard.settings';

interface PersistedSettings {
  displayName?: string;
  podcastCategory?: string;
  emailNotifications?: boolean;
}

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('');
  const [podcastCategory, setPodcastCategory] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings) as PersistedSettings;
        if (typeof parsed.displayName === 'string') {
          setDisplayName(parsed.displayName);
        }
        if (typeof parsed.podcastCategory === 'string') {
          setPodcastCategory(parsed.podcastCategory);
        }
        if (typeof parsed.emailNotifications === 'boolean') {
          setEmailNotifications(parsed.emailNotifications);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load saved settings.';
      setLoadError(message);
      toast.error('Failed to load settings', { description: message });
    } finally {
      setIsLoading(false);
    }

  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      const settings: PersistedSettings = {
        displayName,
        podcastCategory,
        emailNotifications,
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      toast.success('Settings saved', {
        description: `Notifications: ${emailNotifications ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save settings.';
      toast.error('Failed to save settings', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and podcast preferences.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display name
            </label>
            <Input
              id="displayName"
              placeholder="Your name"
              value={displayName}
              disabled={isLoading}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="podcastCategory" className="text-sm font-medium">
              Podcast category
            </label>
            <Input
              id="podcastCategory"
              placeholder="Technology, Marketing, Education..."
              value={podcastCategory}
              disabled={isLoading}
              onChange={(event) => setPodcastCategory(event.target.value)}
            />
          </div>
          <div className="rounded-xl border border-border px-4 py-3 flex items-center justify-between">
            <div>
              <label htmlFor="emailNotifications" className="font-medium">
                Email notifications
              </label>
              <p
                id="emailNotifications-desc"
                className="text-xs text-muted-foreground"
              >
                Receive updates when AI generation completes.
              </p>
            </div>
            <Switch
              id="emailNotifications"
              aria-describedby="emailNotifications-desc"
              checked={emailNotifications}
              disabled={isLoading}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          ) : null}
          {!isLoading && loadError ? (
            <p className="text-sm text-destructive">
              Some settings could not be loaded: {loadError}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

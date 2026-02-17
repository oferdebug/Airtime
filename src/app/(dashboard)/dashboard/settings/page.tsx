"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [podcastCategory, setPodcastCategory] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setIsSaving(true);
    // Placeholder persistence until settings API is connected.
    saveTimeoutRef.current = setTimeout(() => {
      toast.success("Settings saved", {
        description: `Notifications: ${emailNotifications ? "enabled" : "disabled"}`,
      });
      setIsSaving(false);
    }, 250);
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
              onChange={(event) => setPodcastCategory(event.target.value)}
            />
          </div>
          <div className="rounded-xl border border-border px-4 py-3 flex items-center justify-between">
            <div>
              <label htmlFor="emailNotifications" className="font-medium">
                Email notifications
              </label>
              <p id="emailNotifications-desc" className="text-xs text-muted-foreground">
                Receive updates when AI generation completes.
              </p>
            </div>
            <Switch
              id="emailNotifications"
              aria-describedby="emailNotifications-desc"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, UploadCloud } from "lucide-react";
import PodcastUploader from "@/components/Podcast-Uploader";

export const metadata: Metadata = {
  title: "Upload Podcast",
  description:
    "Upload your podcast audio file to get AI-powered transcription, summaries, social posts, and key moments.",
  openGraph: {
    title: "Upload Podcast | Airtime",
    description:
      "Upload your podcast audio file to get AI-powered transcription, summaries, social posts, and key moments.",
  },
  robots: { index: true, follow: true },
};

export default function UploadsPage() {
  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge>Step 1</Badge>
          <Badge variant="outline">Create Episode</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Upload or Record</h1>
        <p className="text-muted-foreground mt-1">
          Add a new episode to your library and start AI generation.
        </p>
      </div>

      <Card className="glass-card rounded-2xl">
        <CardContent className="p-4 sm:p-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1">
            <UploadCloud className="h-3.5 w-3.5" />
            Upload audio file
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1">
            <Mic className="h-3.5 w-3.5" />
            Record directly
          </span>
        </CardContent>
      </Card>

      <div className="glass-card rounded-2xl p-6">
        <PodcastUploader />
      </div>
    </div>
  );
}

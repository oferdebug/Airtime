import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Upload } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="container max-w-5xl mx-auto px-4 py-14 space-y-6">
      <Card className="glass-card rounded-3xl">
        <CardContent className="py-14 px-6 text-center space-y-5">
          <div className="flex justify-center">
            <Badge className="gap-2">
              <Sparkles className="h-4 w-4" />
              Welcome to Airtime
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Your Podcast AI Workspace is Ready
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload audio, generate summaries, extract key moments, and publish
            faster with your new workflow.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button asChild>
              <Link href="/dashboard/uploads">
                Upload Episode
                <Upload className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/projects">Open Library</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          "Transcription enabled",
          "Magic search available",
          "Publishing workflow connected",
        ].map((item) => (
          <Card key={item} className="glass-card">
            <CardContent className="p-4 flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              {item}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


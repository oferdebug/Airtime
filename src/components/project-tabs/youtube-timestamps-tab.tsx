import type { ProjectYouTubeTimestamp } from '@/components/project-detail/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface YouTubeTimestampsTabProps {
  timestamps?: ProjectYouTubeTimestamp[];
}

export function YouTubeTimestampsTab({ timestamps }: YouTubeTimestampsTabProps) {
  if (!timestamps?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>YouTube Timestamps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {timestamps.map((item) => (
          <div key={`${item.timestamp}-${item.description}`} className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">{item.timestamp}</p>
            <p className="text-sm">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

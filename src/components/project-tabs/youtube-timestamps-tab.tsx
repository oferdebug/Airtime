import type { ProjectYouTubeTimestamp } from '@/components/project-detail/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { withOccurrenceKeysBy } from '@/lib/keyed-list';

interface YouTubeTimestampsTabProps {
  timestamps?: ProjectYouTubeTimestamp[];
}

export function YouTubeTimestampsTab({ timestamps }: YouTubeTimestampsTabProps) {
  if (!timestamps?.length) return null;
  const keyedTimestamps = withOccurrenceKeysBy(
    timestamps,
    (item) => `${item.timestamp}-${item.description}`,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>YouTube Timestamps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {keyedTimestamps.map(({ item, key }) => (
          <div key={key} className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">{item.timestamp}</p>
            <p className="text-sm">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

import type { ProjectKeyMoment } from '@/components/project-detail/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KeyMomentsTabProps {
  keyMoments?: ProjectKeyMoment[];
}

export function KeyMomentsTab({ keyMoments }: KeyMomentsTabProps) {
  if (!keyMoments?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Moments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {keyMoments.map((moment) => (
          <div key={`${moment.timestamp}-${moment.time}`} className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">{moment.time}</p>
            <p className="text-sm font-medium">{moment.description}</p>
            <p className="text-sm text-muted-foreground">{moment.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

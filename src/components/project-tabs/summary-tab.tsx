import type { ProjectSummary } from '@/components/project-detail/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryTabProps {
  summary?: ProjectSummary;
}

export function SummaryTab({ summary }: SummaryTabProps) {
  if (!summary) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{summary.tldr}</p>
        {summary.bullets.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {summary.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

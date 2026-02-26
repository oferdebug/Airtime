import type { ProjectSummary } from '@/components/project-detail/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { withOccurrenceKeys } from '@/lib/keyed-list';

interface SummaryTabProps {
  summary?: ProjectSummary;
}

export function SummaryTab({ summary }: SummaryTabProps) {
  if (!summary) return null;
  const bullets = Array.isArray(summary.bullets) ? summary.bullets : [];
  const keyedBullets = withOccurrenceKeys(bullets);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{summary.tldr}</p>
        {keyedBullets.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {keyedBullets.map(({ value, key }) => (
              <li key={key}>{value}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { withOccurrenceKeys } from '@/lib/keyed-list';

interface HashtagsTabProps {
  hashtags?: string[];
}

export function HashtagsTab({ hashtags }: HashtagsTabProps) {
  if (!hashtags?.length) return null;
  const keyedHashtags = withOccurrenceKeys(hashtags).map(({ value, key }) => ({
    tag: value,
    key,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hashtags</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {keyedHashtags.map(({ key, tag }) => (
          <span
            key={key}
            className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </CardContent>
    </Card>
  );
}

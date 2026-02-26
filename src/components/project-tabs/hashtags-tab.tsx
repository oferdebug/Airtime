import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HashtagsTabProps {
  hashtags?: string[];
}

export function HashtagsTab({ hashtags }: HashtagsTabProps) {
  if (!hashtags?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hashtags</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </CardContent>
    </Card>
  );
}

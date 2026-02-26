import type { ProjectTitles } from '@/components/project-detail/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TitlesTabProps {
  titles?: ProjectTitles;
}

function TitleList({
  heading,
  values,
}: {
  heading: string;
  values: string[];
}) {
  if (!values.length) return null;

  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
        {heading}
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

export function TitlesTab({ titles }: TitlesTabProps) {
  if (!titles) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Title Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TitleList heading="YouTube Short" values={titles.youtubeShort} />
        <TitleList heading="YouTube Long" values={titles.youtubeLong} />
        <TitleList heading="Podcast Titles" values={titles.podcastTitles} />
        <TitleList heading="SEO Keywords" values={titles.seoKeywords} />
      </CardContent>
    </Card>
  );
}

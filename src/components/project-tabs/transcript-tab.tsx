import type { ProjectTranscript } from '@/components/project-detail/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TranscriptTabProps {
  transcript: ProjectTranscript;
}

export function TranscriptTab({ transcript }: TranscriptTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcript</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {transcript.text}
        </p>
      </CardContent>
    </Card>
  );
}

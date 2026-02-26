import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSmartDate } from '@/lib/format';

interface ProcessingFlowProps {
  isProcessing: boolean;
  transcriptionStatus: string;
  generationStatus: string;
  fileDuration?: number;
  createdAt: number;
}

export function ProcessingFlow({
  isProcessing,
  transcriptionStatus,
  generationStatus,
  fileDuration,
  createdAt,
}: ProcessingFlowProps) {
  const minutes =
    typeof fileDuration === 'number' && fileDuration > 0
      ? Math.round(fileDuration / 60)
      : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Processing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isProcessing ? (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>We are processing your audio in real time.</span>
          </div>
        ) : (
          <p className="text-muted-foreground">Processing is not active.</p>
        )}
        <p className="text-muted-foreground">
          Started {formatSmartDate(createdAt)}
          {minutes ? ` • approx. ${minutes} min source file` : ''}
        </p>
        <div className="grid gap-1">
          <p className="capitalize">Transcription: {transcriptionStatus}</p>
          <p className="capitalize">Content generation: {generationStatus}</p>
        </div>
      </CardContent>
    </Card>
  );
}

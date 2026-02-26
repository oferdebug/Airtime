import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProjectDetailData } from '@/components/project-detail/types';

interface ProjectStatusCardProps {
  project: ProjectDetailData;
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant="outline" className="capitalize">
        {value}
      </Badge>
    </div>
  );
}

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Project Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <StatusRow label="Overall" value={project.status} />
        <StatusRow
          label="Transcription"
          value={project.jobStatus?.transcription ?? 'pending'}
        />
        <StatusRow
          label="Generation"
          value={project.jobStatus?.contentGeneration ?? 'pending'}
        />
      </CardContent>
    </Card>
  );
}

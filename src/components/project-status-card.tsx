import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProjectDetailData } from '@/components/project-detail/types';

interface ProjectStatusCardProps {
  project: ProjectDetailData;
}

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Project Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Overall</span>
          <Badge variant="outline" className="capitalize">
            {project.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Transcription</span>
          <Badge variant="outline" className="capitalize">
            {project.jobStatus?.transcription ?? 'pending'}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Generation</span>
          <Badge variant="outline" className="capitalize">
            {project.jobStatus?.contentGeneration ?? 'pending'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

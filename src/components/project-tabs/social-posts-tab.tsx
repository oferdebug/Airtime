import type { ProjectSocialPosts } from '@/components/project-detail/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SocialPostsTabProps {
  socialPosts?: ProjectSocialPosts;
}

export function SocialPostsTab({ socialPosts }: SocialPostsTabProps) {
  if (!socialPosts) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Posts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(socialPosts).map(([platform, post]) => (
          <div key={platform} className="rounded-md border p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              {platform}
            </p>
            <p className="whitespace-pre-wrap text-sm">{post}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

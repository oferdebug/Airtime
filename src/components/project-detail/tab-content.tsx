import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TabContentProps {
  isLoading: boolean;
  data: unknown;
  error?: string;
  emptyMessage?: string;
  children: ReactNode;
}

function hasContent(data: unknown) {
  if (Array.isArray(data)) return data.length > 0;
  if (data == null) return false;
  if (typeof data === 'object') return Object.keys(data).length > 0;
  if (typeof data === 'string') return data.trim().length > 0;
  return Boolean(data);
}

export function TabContent({
  isLoading,
  data,
  error,
  emptyMessage = 'No content available',
  children,
}: TabContentProps) {
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !hasContent(data)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Generating content...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasContent(data)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

import { Skeleton } from "./ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="container mx-auto px-6 py-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-full max-w-96 mx-auto" />
          <Skeleton className="h-6 w-full max-w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-8 space-y-4">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

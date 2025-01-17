import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function NodeListSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Search Skeleton */}
      <Skeleton className="h-9 w-full" />

      {/* Categories Skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Category Header */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Nodes */}
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <Card key={j} className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

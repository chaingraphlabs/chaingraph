import { ScrollArea } from '@/components/ui/scroll-area.tsx'

export function EventList() {
  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No events recorded yet.
        </p>
      </div>
    </ScrollArea>
  )
}

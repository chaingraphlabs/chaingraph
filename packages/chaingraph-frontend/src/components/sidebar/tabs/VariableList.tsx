import { ScrollArea } from '@/components/ui/scroll-area'

export function VariableList() {
  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No variables defined yet.
        </p>
      </div>
    </ScrollArea>
  )
}

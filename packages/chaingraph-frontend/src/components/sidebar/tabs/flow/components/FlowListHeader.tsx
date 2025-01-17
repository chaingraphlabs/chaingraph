import type { FlowMetadata } from '@chaingraph/types'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandInput,
} from '@/components/ui/command'
import { PlusIcon } from '@radix-ui/react-icons'
import { Spinner } from '@radix-ui/themes'

interface FlowListHeaderProps {
  selectedFlow?: FlowMetadata
  isLoadingSelectedFlow: boolean
  onCreateClick: () => void
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function FlowListHeader({
  selectedFlow,
  isLoadingSelectedFlow,
  onCreateClick,
  searchQuery,
  onSearchChange,
}: FlowListHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Selected Flow Indicator */}
      {(selectedFlow || isLoadingSelectedFlow) && (
        <div className="inline-flex items-center gap-1.5 text-sm text-primary">
          <span className="text-muted-foreground">Selected:</span>
          {isLoadingSelectedFlow
            ? (
                <Spinner className="w-3 h-3" />
              )
            : (
                <span className="font-medium">{selectedFlow?.name}</span>
              )}
        </div>
      )}

      {/* Search */}
      <Command className="rounded-lg border shadow-none">
        <CommandInput
          value={searchQuery}
          onValueChange={onSearchChange}
          placeholder="Search flows..."
          className="h-10"
        />
      </Command>

      {/* Create Button */}
      <Button
        onClick={onCreateClick}
        className="w-full"
      >
        <PlusIcon className="mr-2 h-4 w-4" />
        New Flow
      </Button>
    </div>
  )
}

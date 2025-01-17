import type { FlowMetadata } from '@chaingraph/types'
import { MagnifyingGlassIcon, PlusIcon } from '@radix-ui/react-icons'
import { Box, Button, Spinner, Text } from '@radix-ui/themes'

interface FlowListHeaderProps {
  selectedFlow?: FlowMetadata
  isLoadingSelectedFlow: boolean
  onCreateClick: () => void
}

export function FlowListHeader({ selectedFlow, isLoadingSelectedFlow, onCreateClick }: FlowListHeaderProps) {
  return (
    <Box className="space-y-3">
      {(selectedFlow || isLoadingSelectedFlow) && (
        <div className="flex items-center gap-2">
          {isLoadingSelectedFlow && (
            <Spinner />
          )}
          <Text size="2" className="text-primary-500 dark:text-primary-400">
            {!isLoadingSelectedFlow && `Selected: ${selectedFlow?.name}`}
          </Text>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon
          width="16"
          height="16"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search flows..."
          className="w-full pl-9 pr-4 py-2 text-sm
                     bg-ui-surface-light dark:bg-ui-surface-dark
                     border border-ui-border-light dark:border-ui-border-dark
                     rounded-md
                     focus:outline-none focus:ring-2 focus:ring-primary-500
                     placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Actions */}
      <Button
        onClick={onCreateClick}
        className="w-full bg-primary-500 hover:bg-primary-600 text-white
                   dark:bg-primary-600 dark:hover:bg-primary-700
                   flex items-center justify-center gap-2"
      >
        <PlusIcon />
        New Flow
      </Button>
    </Box>
  )
}

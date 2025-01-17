import type { FlowMetadata } from '@chaingraph/types'
import { useFlowSearch } from '@/components/sidebar/tabs/flow/hooks/useFlowSearch'
import { useFlowSort } from '@/components/sidebar/tabs/flow/hooks/useFlowSort'
import { ErrorMessage } from '@/components/ui/error-message.tsx'
import { Spinner } from '@radix-ui/themes'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { EmptyFlowState } from './components/EmptyFlowState'
import { FlowForm } from './components/FlowForm'
import { FlowListHeader } from './components/FlowListHeader'
import { FlowListItem } from './components/FlowListItem'
import { useFlows } from './hooks/useFlows'
import { useSelectedFlow } from './hooks/useSelectedFlow'

export function FlowList() {
  // Get flow context
  const { selectedFlow, setSelectedFlow, isLoading: isLoadingSelectedFlow } = useSelectedFlow()

  // State for create/edit forms
  const [isCreating, setIsCreating] = useState(false)
  const [editingFlow, setEditingFlow] = useState<FlowMetadata | undefined>(undefined)

  // Get flows data and mutations
  const {
    flows,
    isLoading,
    error,
    createFlow,
    deleteFlow,
    editFlow,
    isCreating: isCreatingFlow,
    isDeleting: isDeletingFlow,
    isEditing: isEditingFlow,
  } = useFlows()

  // Sort flows with selected flow at the top
  const sortedFlows = useFlowSort(flows, selectedFlow?.id)

  // Search functionality with sorted flows
  const { searchQuery, setSearchQuery, filteredFlows } = useFlowSearch(sortedFlows)

  // Handlers
  const handleCreateClick = useCallback(() => {
    setIsCreating(true)
    setEditingFlow(undefined)
  }, [])

  const handleEditClick = useCallback((flow: FlowMetadata) => {
    setEditingFlow(flow)
    setIsCreating(false)
  }, [])

  // Handle flow selection
  const handleFlowSelect = useCallback((flow: FlowMetadata) => {
    setSelectedFlow(flow)
  }, [setSelectedFlow])

  // Loading state
  if (isLoading) {
    return <Spinner />
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage>
        Failed to load flows:
        {' '}
        {error.message}
      </ErrorMessage>
    )
  }

  const hasFlows = filteredFlows && filteredFlows.length > 0
  const isEditing = Boolean(editingFlow)
  const showEmptyState = !flows?.length && !isCreating && !isEditing
  const showList = (flows?.length ?? 0) > 0 && !isCreating && !isEditing

  return (
    <div className="flex flex-col h-full relative">
      <AnimatePresence mode="sync">
        {showEmptyState && (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <EmptyFlowState onCreateClick={handleCreateClick} />
          </motion.div>
        )}

        {showList && (
          <motion.div
            key="flow-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            <div className="px-2 pt-4 pb-2">
              <FlowListHeader
                selectedFlow={selectedFlow}
                isLoadingSelectedFlow={isLoadingSelectedFlow}
                onCreateClick={handleCreateClick}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {!hasFlows && searchQuery
                ? (
                    <div className="text-center p-4 text-muted-foreground">
                      No flows found matching "
                      {searchQuery}
                      "
                    </div>
                  )
                : (
                    <div className="space-y-2">
                      {filteredFlows?.map(flow => (
                        <FlowListItem
                          key={flow.id}
                          flow={flow}
                          selected={selectedFlow?.id === flow.id}
                          onSelect={() => handleFlowSelect(flow)}
                          onDelete={() => deleteFlow(flow.id!)}
                          onEdit={() => handleEditClick(flow)}
                          disabled={isCreatingFlow || isDeletingFlow || isEditingFlow}
                        />
                      ))}
                    </div>
                  )}
            </div>
          </motion.div>
        )}

        {/* Forms */}
        <AnimatePresence mode="sync">
          {(isCreating || editingFlow) && (
            <motion.div
              key={isCreating ? 'create-form' : 'edit-form'}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                },
              }}
              exit={{
                opacity: 0,
                y: 20,
                scale: 0.95,
                transition: {
                  duration: 0.2,
                },
              }}
              className="absolute inset-x-0 top-0 px-2 py-2 z-10"
            >
              <FlowForm
                flow={editingFlow}
                onCancel={() => {
                  setIsCreating(false)
                  setEditingFlow(undefined)
                }}
                onCreate={async (data) => {
                  await createFlow(data)
                  setIsCreating(false)
                }}
                onEdit={async (data) => {
                  await editFlow(data)
                  setEditingFlow(undefined)
                }}
                isLoading={isCreatingFlow || isEditingFlow}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  )
}

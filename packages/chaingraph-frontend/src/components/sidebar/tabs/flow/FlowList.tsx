import type { FlowMetadata } from '@badaitech/chaingraph-types'
import { useFlowSearch } from '@/components/sidebar/tabs/flow/hooks/useFlowSearch'
import { useFlowSort } from '@/components/sidebar/tabs/flow/hooks/useFlowSort'
import { ErrorMessage } from '@/components/ui/error-message.tsx'
import {
  $flowsError,
  createFlow,
  type CreateFlowEvent,
  deleteFlow,
  setActiveFlowId,
  updateFlow,
  type UpdateFlowEvent,
} from '@/store'
import {
  $activeFlowId,
  $createFlowError,
  $deleteFlowError,
  $flows,
  $isCreatingFlow,
  $isDeletingFlow,
  $isFlowsLoading,
  $isUpdatingFlow,
  $updateFlowError,
} from '@/store/flow'
import { Spinner } from '@radix-ui/themes'
import { useUnit } from 'effector-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { EmptyFlowState } from './components/EmptyFlowState'
import { FlowForm } from './components/FlowForm'
import { FlowListHeader } from './components/FlowListHeader'
import { FlowListItem } from './components/FlowListItem'

export function FlowList() {
  // Get store values and effects statuses
  const {
    flows,
    activeFlowId,
    isLoading,
    loadError,
    createError,
    updateError,
    deleteError, // TODO: handle delete error
    isCreatingFlow,
    isDeletingFlow,
    isEditingFlow,
  } = useUnit({
    flows: $flows,
    activeFlowId: $activeFlowId,
    isLoading: $isFlowsLoading,
    loadError: $flowsError,
    createError: $createFlowError,
    updateError: $updateFlowError,
    deleteError: $deleteFlowError,
    isCreatingFlow: $isCreatingFlow,
    isDeletingFlow: $isDeletingFlow,
    isEditingFlow: $isUpdatingFlow,
  })

  // Local UI state
  const [isCreating, setIsCreating] = useState(false)
  const [editingFlow, setEditingFlow] = useState<FlowMetadata | undefined>(undefined)

  // Sort flows with selected flow at the top
  const sortedFlows = useFlowSort(flows, activeFlowId)

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

  const handleCreateFlow = useCallback(async (event: CreateFlowEvent) => {
    await createFlow(event)
    setIsCreating(false)
  }, [])

  const handleEditFlow = useCallback(async (event: UpdateFlowEvent) => {
    if (editingFlow?.id) {
      await updateFlow(event)
      setEditingFlow(undefined)
    }
  }, [editingFlow])

  // Loading state
  if (isLoading) {
    return <Spinner />
  }

  // Error state
  if (loadError) {
    return (
      <ErrorMessage>
        Failed to load flows:
        {' '}
        {loadError.message}
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
                selectedFlow={flows?.find(flow => flow.id === activeFlowId)}
                isLoadingSelectedFlow={false}
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
                          selected={activeFlowId === flow.id}
                          onSelect={() => setActiveFlowId(flow.id!)}
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
                onCreate={handleCreateFlow}
                onEdit={handleEditFlow}
                isLoading={isCreatingFlow || isEditingFlow}
                error={createError || updateError}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  )
}

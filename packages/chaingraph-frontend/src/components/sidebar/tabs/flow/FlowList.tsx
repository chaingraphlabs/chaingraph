import type { FlowMetadata } from '@chaingraph/types'
import { Box, Spinner } from '@radix-ui/themes'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { EmptyFlowState } from './components/EmptyFlowState'
import { FlowForm } from './components/FlowForm'
import { FlowListHeader } from './components/FlowListHeader'
import { FlowListItem } from './components/FlowListItem'
import { useFlows } from './hooks/useFlows'
import { useSelectedFlow } from './hooks/useSelectedFlow.ts'

export function FlowList() {
  // Get flow context
  const { selectedFlow, setSelectedFlow, isLoading: isLoadingSelectedFlow } = useSelectedFlow()

  // State for create/edit forms
  const [isCreating, setIsCreating] = useState(false)
  const [editingFlow, setEditingFlow] = useState<FlowMetadata | null>(null)

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

  // Handlers
  const handleCreateClick = useCallback(() => {
    setIsCreating(true)
    setEditingFlow(null)
  }, [])

  const handleEditClick = useCallback((flow: FlowMetadata) => {
    setEditingFlow(flow)
    setIsCreating(false)
  }, [])

  // Handle flow selection
  const handleFlowSelect = useCallback((flow: FlowMetadata) => {
    setSelectedFlow(flow)
  }, [setSelectedFlow])

  // Sorted flows
  const sortedFlows = useMemo(() => {
    if (!flows)
      return []

    return [...flows].filter(
      flow => flow && flow.updatedAt && flow.updatedAt.getTime() > 0,
    ).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }, [flows])

  // Loading state
  if (isLoading) {
    return <Spinner />
  }

  // Error state
  if (error) {
    return (
      <Box className="p-4 text-red-500">
        Error loading flows:
        {' '}
        {error.message}
      </Box>
    )
  }

  const hasFlows = flows && flows.length > 0
  const isEditing = Boolean(editingFlow)
  const showEmptyState = !hasFlows && !isCreating && !isEditing
  const showList = hasFlows && !isCreating && !isEditing

  return (
    <div className="flex flex-col h-full">
      {/* Empty State */}
      <AnimatePresence mode="wait">
        {showEmptyState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <EmptyFlowState onCreateClick={handleCreateClick} />
          </motion.div>
        )}

        {/* Flow List */}
        {showList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="px-2 pt-4 pb-2">
              <FlowListHeader
                selectedFlow={selectedFlow}
                isLoadingSelectedFlow={isLoadingSelectedFlow}
                onCreateClick={handleCreateClick}
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              <div className="space-y-2">
                {sortedFlows?.map(flow => (
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
            </div>
          </motion.div>
        )}

        {/* Create Form */}
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-2 py-2"
          >
            <FlowForm
              onCancel={() => setIsCreating(false)}
              onCreate={async (data) => {
                await createFlow(data)
                setIsCreating(false)
              }}
              isLoading={isCreatingFlow}
            />
          </motion.div>
        )}

        {/* Edit Form */}
        {editingFlow && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-2 py-2"
          >
            <FlowForm
              flow={editingFlow}
              onCancel={() => setEditingFlow(null)}
              onEdit={async (data) => {
                await editFlow(data)
                setEditingFlow(null)
              }}
              isLoading={isEditingFlow}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

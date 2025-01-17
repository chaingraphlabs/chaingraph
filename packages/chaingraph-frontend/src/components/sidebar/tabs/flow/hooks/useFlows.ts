import type { FlowMetadata } from '@chaingraph/types'
import { trpc } from '@chaingraph/frontend/api/trpc/client'
import { useSelectedFlow } from './useSelectedFlow.ts'

export function useFlows() {
  const { selectedFlow, setSelectedFlow } = useSelectedFlow()

  // Get flows query
  const {
    data: flows,
    isLoading,
    error,
    refetch,
  } = trpc.flow.list.useQuery(undefined, {
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
  })

  // Get utils for optimistic updates
  const utils = trpc.useUtils()

  // Create flow mutation
  const createFlowMutation = trpc.flow.create.useMutation({
    // Optimistically update the flows list
    onMutate: async (newFlow) => {
      await utils.flow.list.cancel()

      const previousFlows = utils.flow.list.getData()

      utils.flow.list.setData(undefined, (old) => {
        if (!old)
          return [{ ...newFlow, id: 'temp-id' } as unknown as FlowMetadata]
        return [...old, { ...newFlow, id: 'temp-id' } as unknown as FlowMetadata]
      })

      return { previousFlows }
    },
    // If mutation fails, roll back to the previous state
    onError: (_err, _newFlow, context) => {
      if (context?.previousFlows) {
        utils.flow.list.setData(undefined, context.previousFlows)
      }
    },
    // After success, invalidate and refetch
    onSettled: () => {
      utils.flow.list.invalidate()
    },
  })

  // Delete flow mutation
  const deleteFlowMutation = trpc.flow.delete.useMutation({
    // Optimistically remove the flow from the list
    onMutate: async (flowId) => {
      await utils.flow.list.cancel()

      const previousFlows = utils.flow.list.getData()

      // If deleting currently selected flow, clear selection
      if (selectedFlow?.id === flowId) {
        setSelectedFlow(null)
      }

      utils.flow.list.setData(undefined, (old) => {
        if (!old)
          return []
        return old.filter(flow => flow.id !== flowId)
      })

      return { previousFlows }
    },
    // If mutation fails, roll back to the previous state
    onError: (_err, _flowId, context) => {
      if (context?.previousFlows) {
        utils.flow.list.setData(undefined, context.previousFlows)
      }
    },
    // After success, invalidate and refetch
    onSettled: () => {
      utils.flow.list.invalidate()
    },
  })

  // Edit flow mutation
  const editFlowMutation = trpc.flow.edit.useMutation({
    // Optimistically update the flow in the list
    onMutate: async ({ flowId, ...updates }) => {
      await utils.flow.list.cancel()

      const previousFlows = utils.flow.list.getData()

      utils.flow.list.setData(undefined, (old) => {
        if (!old)
          return []
        return old.map((flowMeta) => {
          if (flowMeta.id === flowId) {
            return {
              ...flowMeta,
              ...updates,
              updatedAt: new Date(),
            } as unknown as FlowMetadata
          }
          return flowMeta
        })
      })

      return { previousFlows }
    },
    onError: (_err, data, context) => {
      if (context?.previousFlows) {
        utils.flow.list.setData(undefined, context.previousFlows)

        // Restore selection if error occurred
        const deletedFlow = context.previousFlows.find(f => f.id === data.flowId)
        if (deletedFlow) {
          setSelectedFlow(deletedFlow)
        }
      }
    },
    onSettled: () => {
      utils.flow.list.invalidate()
    },
  })

  return {
    flows,
    isLoading,
    error,
    refetch,
    createFlow: createFlowMutation.mutate,
    isCreating: createFlowMutation.isPending,
    deleteFlow: deleteFlowMutation.mutate,
    isDeleting: deleteFlowMutation.isPending,
    editFlow: editFlowMutation.mutate,
    isEditing: editFlowMutation.isPending,
  }
}

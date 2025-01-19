import type { FlowMetadata } from '@chaingraph/types'
import { trpc } from '@/api/trpc/client'
import { useAppDispatch, useAppSelector } from '@/store_OLD/hooks'
import { selectSelectedFlow, setSelectedFlowMetadata } from '@/store_OLD/slices/flowSlice'

export function useFlowSelection() {
  const dispatch = useAppDispatch()
  const selectedFlowMetadata = useAppSelector(selectSelectedFlow)

  // Query for selected flow metadata
  const {
    data: fullMetadata,
    isLoading,
    error,
  } = trpc.flow.getMeta.useQuery(selectedFlowMetadata?.id!, {
    enabled: Boolean(selectedFlowMetadata?.id),
    staleTime: 1000 * 60,
  })

  // Handle flow selection/deselection
  const setSelectedFlow = (flow: FlowMetadata | null) => {
    dispatch(setSelectedFlowMetadata(flow))
  }

  return {
    selectedFlow: error ? undefined : fullMetadata ?? selectedFlowMetadata,
    setSelectedFlow,
    isLoading,
    error,
  }
}

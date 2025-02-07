import type { FlowMetadata } from '@badaitech/chaingraph-types'
import { useMemo, useState } from 'react'

export function useFlowSearch(flows: FlowMetadata[] | undefined) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFlows = useMemo(() => {
    if (!flows || !searchQuery.trim())
      return flows

    const query = searchQuery.toLowerCase().trim()

    return flows.filter((flow) => {
      // Search in name
      const nameMatch = flow.name.toLowerCase().includes(query)
      // Search in description
      const descriptionMatch = flow.description?.toLowerCase().includes(query)
      // Search in tags
      const tagsMatch = flow.tags?.some(tag => tag.toLowerCase().includes(query))

      return nameMatch || descriptionMatch || tagsMatch
    })
  }, [flows, searchQuery])

  return {
    searchQuery,
    setSearchQuery,
    filteredFlows,
  }
}

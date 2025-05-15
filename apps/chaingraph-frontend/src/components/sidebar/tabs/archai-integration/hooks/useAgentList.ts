/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { GraphQL } from '@badaitech/badai-api'
import type { UserSession } from '../utils/api'
import { useCallback, useEffect, useState } from 'react'
import { fetchAgents } from '../utils/api'

// Interface for our enhanced agent with collection info
export interface EnhancedAgent {
  id: string
  name?: string
  description?: string
  avatar?: string
  tags?: string[]
  // Collection info we add
  collection_info?: {
    id: string
    title: string
  }
  // Allow any other properties that might be in the agent object
  [key: string]: any
}

// Filter collections by ID - these are the user's agents
const ALLOWED_COLLECTION_IDS = [
  'not_deployed',
  'deployed_privately',
  'deployed_to_space',
]

/**
 * Hook for fetching and managing agent list data
 * @param session User session token
 * @returns Object with agents data and loading state
 */
export function useAgentList(session: UserSession) {
  const [agents, setAgents] = useState<EnhancedAgent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadAgents = useCallback(async () => {
    if (!session) {
      setAgents([])
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use any type to work around TypeScript constraints
      const marketplaceAgents = await fetchAgents(session)

      if (!marketplaceAgents || !Array.isArray(marketplaceAgents)) {
        console.warn('Unexpected response format:', marketplaceAgents)
        setAgents([])
        setIsLoading(false)
        return
      }

      // Now we have the collections array
      const collections = marketplaceAgents
      // We'll combine agents from all allowed collections
      const enhancedAgents: EnhancedAgent[] = []

      // Get badge label based on collection ID
      const getBadgeLabel = (collectionId: string, title: string) => {
        if (collectionId === 'not_deployed')
          return 'Not Deployed'
        if (collectionId === 'deployed_privately')
          return 'Private'
        if (collectionId === 'deployed_to_space')
          return 'Public'
        return title || 'Unknown'
      }

      // Process each collection
      for (const collection of collections) {
        const collectionId = collection.collection_id

        // Only process collections in our allowed list
        if (!collectionId || !ALLOWED_COLLECTION_IDS.includes(collectionId)) {
          continue
        }

        const badgeLabel = getBadgeLabel(collectionId, collection.title || '')
        const collectionAgents = collection.agents as GraphQL.AgentFieldsFragment[]

        // Process agents from this collection
        if (Array.isArray(collectionAgents)) {
          for (const agent of collectionAgents) {
            // Map agent properties to our expected format
            const enhancedAgent: EnhancedAgent = {
              id: agent.agent_id || '',
              name: agent.first_name
                ? `${agent.first_name} ${agent.last_name || ''}`.trim()
                : agent.username || 'Unnamed Agent',
              description: agent.role,
              // Add collection as a tag
              tags: [badgeLabel],
              // Add collection info
              collection_info: {
                id: collectionId,
                title: badgeLabel,
              },
              // Include all original properties
              ...agent,

              avatar: agent.avatar || '/image/avatar/avatar-default.svg',
            }

            enhancedAgents.push(enhancedAgent)
          }
        }
      }

      setAgents(enhancedAgents)
    } catch (err) {
      console.error('Error fetching agents:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'))
      setAgents([])
    } finally {
      setIsLoading(false)
    }
  }, [session])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  return {
    agents,
    isLoading,
    error,
    refresh: loadAgents,
  }
}

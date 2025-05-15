/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { GraphQL } from '@badaitech/badai-api'
import type { UserSession } from '../utils/api'
import { $archaiConfig } from '@/store'
import { useUnit } from 'effector-react'
import { useCallback, useEffect, useState } from 'react'
import { fetchChatRooms } from '../utils/api'

/**
 * Hook for fetching and managing chat rooms data
 * @param session User session token
 * @returns Object with chat rooms data and loading state
 */
export function useChatRooms(session: UserSession) {
  const config = useUnit($archaiConfig)
  const [chatRooms, setChatRooms] = useState<GraphQL.ChatRoom[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadChatRooms = useCallback(async () => {
    if (!session) {
      setChatRooms([])
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchChatRooms(session)
      setChatRooms(Array.isArray(data)
        ? data.filter((room) => {
            // if the config.agentID is not empty then filter the chat rooms
          // by room.participants having the agentID
            if (config.agentID) {
              return room.participants?.some((participant) => {
                return participant.participant_id === config.agentID || participant.agent_id === config.agentID
              })
            }

            // if the config.agentID is empty then return all chat rooms
            return true
          })
        : [])
    } catch (err) {
      console.error('Error fetching chat rooms:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch chat rooms'))
      setChatRooms([])
    } finally {
      setIsLoading(false)
    }
  }, [config.agentID, session])

  useEffect(() => {
    loadChatRooms()
  }, [loadChatRooms])

  return {
    chatRooms,
    isLoading,
    error,
    refresh: loadChatRooms,
  }
}

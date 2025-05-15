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
import { fetchMessages } from '../utils/api'

/**
 * Hook for fetching and managing messages data for a specific chat
 * @param session User session token
 * @param chatId Chat ID to fetch messages from
 * @param limit Maximum number of messages to fetch
 * @returns Object with messages data and loading state
 */
export function useMessages(session: UserSession, chatId: string, limit: number = 100) {
  const [messages, setMessages] = useState<GraphQL.MessageFieldsFragment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadMessages = useCallback(
    async (fromId: number = 0) => {
      if (!session || !chatId) {
        setMessages([])
        setError(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const data = await fetchMessages(session, chatId, fromId, limit)
        const loadedMessages = Array.isArray(data) ? data : []

        setMessages(
          loadedMessages.filter(message => message.text && !message.is_system),
        )
      } catch (err) {
        console.error('Error fetching messages:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch messages'))
        setMessages([])
      } finally {
        setIsLoading(false)
      }
    },
    [session, chatId, limit],
  )

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  return {
    messages,
    isLoading,
    error,
    refresh: loadMessages,
  }
}

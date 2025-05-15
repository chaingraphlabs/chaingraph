/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { UserSession } from '../utils/api'
import { useCallback, useEffect, useState } from 'react'
import { fetchUserProfile } from '../utils/api'

/**
 * Hook for fetching and managing user profile data
 * @param session User session token
 * @returns Object with user profile data and loading state
 */
export function useUserProfile(session: UserSession) {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadProfile = useCallback(async () => {
    if (!session) {
      setProfile(null)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchUserProfile(session)
      setProfile(data)
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch user profile'))
    } finally {
      setIsLoading(false)
    }
  }, [session])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return {
    profile,
    isLoading,
    error,
    refresh: loadProfile,
  }
}

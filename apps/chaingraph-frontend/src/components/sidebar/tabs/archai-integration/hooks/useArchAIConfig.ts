/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { useCallback, useEffect } from 'react'
import {
  $archaiConfig,
  $isConfigComplete,
  initConfig,
  setAgentID,
  setAgentSession,
  setChatID,
  setMessageID,
  setUserSession,
} from '../../../../../store/archai'

/**
 * Hook for managing the ArchAI configuration using Effector stores
 * @returns Configuration state and update functions
 */
export function useArchAIConfig() {
  const config = useUnit($archaiConfig)
  const isComplete = useUnit($isConfigComplete)

  // Initialize config from localStorage on mount
  useEffect(() => {
    initConfig()
  }, [])

  // Create adapter for messageID to handle string inputs
  const setMessageIDAdapter = useCallback((value: string) => {
    // Convert string messageId to number
    const numericValue = Number.parseInt(value, 10) || 0
    setMessageID(numericValue)
  }, [])

  return {
    config,
    isLoaded: true, // Always true with Effector
    isComplete,
    setUserSession,
    setAgentID,
    setAgentSession,
    setChatID,
    setMessageID: setMessageIDAdapter,
  }
}

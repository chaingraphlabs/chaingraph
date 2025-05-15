/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { sample } from 'effector'
import { ARCHAI_CONFIG_KEY } from '../../components/sidebar/tabs/archai-integration/utils/localStorage'
import { archaiDomain } from '../domains'

// Interface for ArchAI configuration
export interface ArchAIConfig {
  userSession: string
  agentID: string
  agentSession: string
  chatID: string
  messageID: number // Changed to number from string
}

// Default configuration
export const DEFAULT_CONFIG: ArchAIConfig = {
  userSession: '',
  agentID: '',
  agentSession: '',
  chatID: '',
  messageID: 0, // Default as 0
}

// Events
export const setUserSession = archaiDomain.createEvent<string>()
export const setAgentID = archaiDomain.createEvent<string>()
export const setAgentSession = archaiDomain.createEvent<string>()
export const setChatID = archaiDomain.createEvent<string>()
export const setMessageID = archaiDomain.createEvent<number>() // Accept number
export const resetConfig = archaiDomain.createEvent()
export const initConfig = archaiDomain.createEvent()

// Store
export const $archaiConfig = archaiDomain.createStore<ArchAIConfig>(DEFAULT_CONFIG)
  .on(setUserSession, (state, userSession) => ({ ...state, userSession }))
  .on(setAgentID, (state, agentID) => ({ ...state, agentID }))
  .on(setAgentSession, (state, agentSession) => ({ ...state, agentSession }))
  .on(setChatID, (state, chatID) => ({ ...state, chatID }))
  .on(setMessageID, (state, messageID) => ({ ...state, messageID }))
  .reset(resetConfig)

// Derived stores
export const $isConfigComplete = $archaiConfig.map(config =>
  Boolean(
    config.userSession
    && config.agentID
    && config.agentSession
    && config.chatID
    && config.messageID,
  ),
)

// Effects
export const loadConfigFromLocalStorageFx = archaiDomain.createEffect(() => {
  try {
    const storedConfig = localStorage.getItem(ARCHAI_CONFIG_KEY)
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig) as Partial<ArchAIConfig>

      // Handle potential string messageID in existing localStorage data
      if (typeof parsedConfig.messageID === 'string') {
        parsedConfig.messageID = Number.parseInt(parsedConfig.messageID, 10) || 0
      }

      return {
        ...DEFAULT_CONFIG,
        ...parsedConfig,
      }
    }
  } catch (error) {
    console.error('Failed to load ArchAI configuration:', error)
  }
  return DEFAULT_CONFIG
})

export const saveConfigToLocalStorageFx = archaiDomain.createEffect((config: ArchAIConfig) => {
  try {
    localStorage.setItem(ARCHAI_CONFIG_KEY, JSON.stringify(config))
    console.log('ArchAI config saved to localStorage:', config)
  } catch (error) {
    console.error('Failed to save ArchAI configuration:', error)
  }
})

// Initialize config from localStorage on init
sample({
  clock: initConfig,
  target: loadConfigFromLocalStorageFx,
})

// Update the store when config is loaded
sample({
  clock: loadConfigFromLocalStorageFx.doneData,
  target: $archaiConfig,
})

// Persist config to localStorage on changes
sample({
  source: $archaiConfig,
  clock: [setUserSession, setAgentID, setAgentSession, setChatID, setMessageID],
  target: saveConfigToLocalStorageFx,
})

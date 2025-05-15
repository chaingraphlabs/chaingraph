/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Local storage key for ArchAI configuration
export const ARCHAI_CONFIG_KEY = 'archai-integration-config'

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
  messageID: 0, // Changed to 0 from empty string
}

/**
 * Saves the ArchAI configuration to localStorage
 * @param config The configuration object to save
 */
export function saveConfig(config: Partial<ArchAIConfig>): void {
  try {
    // Get existing config
    const existingConfig = getConfig()
    // Merge with new config
    const updatedConfig = { ...existingConfig, ...config }
    // Save to localStorage
    localStorage.setItem(ARCHAI_CONFIG_KEY, JSON.stringify(updatedConfig))
  } catch (error) {
    console.error('Failed to save ArchAI configuration:', error)
  }
}

/**
 * Gets the ArchAI configuration from localStorage
 * @returns The stored configuration or default values
 */
export function getConfig(): ArchAIConfig {
  try {
    const savedConfig = localStorage.getItem(ARCHAI_CONFIG_KEY)
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig) as Partial<ArchAIConfig>

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
    console.error('Failed to parse ArchAI configuration:', error)
  }
  return DEFAULT_CONFIG
}

/**
 * Clears the stored ArchAI configuration
 */
export function clearConfig(): void {
  localStorage.removeItem(ARCHAI_CONFIG_KEY)
}

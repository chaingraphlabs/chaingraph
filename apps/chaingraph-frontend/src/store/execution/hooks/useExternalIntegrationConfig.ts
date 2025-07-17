/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { useCallback } from 'react'
import {
  $executionExternalIntegrationConfig,
  addExternalIntegrationConfigEvent,
  clearExternalIntegrationConfigEvent,
  removeExternalIntegrationConfigEvent,
} from '../stores'

export interface ExternalIntegrationConfig {
  [key: string]: any
}

export interface UseExternalIntegrationConfigReturn {
  /**
   * Current external integration configuration as a Map
   */
  config: Map<string, any>
  /**
   * Current external integration configuration as a plain object
   */
  configObject: ExternalIntegrationConfig
  /**
   * Add or update an external integration configuration
   */
  setConfig: (key: string, value: any) => void
  /**
   * Remove an external integration configuration
   */
  removeConfig: (key: string) => void
  /**
   * Clear all external integration configurations
   */
  clearConfig: () => void
  /**
   * Get a specific configuration value
   */
  getConfig: (key: string) => any
  /**
   * Check if a configuration key exists
   */
  hasConfig: (key: string) => boolean
  /**
   * Get all configuration keys
   */
  getConfigKeys: () => string[]
  /**
   * Set multiple configurations at once
   */
  setMultipleConfigs: (configs: ExternalIntegrationConfig) => void
}

/**
 * Hook for managing external integration configurations
 *
 * @example
 * ```tsx
 * const { config, setConfig, removeConfig, clearConfig } = useExternalIntegrationConfig()
 *
 * // Add a new integration config
 * setConfig('telegram', { botToken: 'your-bot-token', chatId: '123' })
 *
 * // Remove a config
 * removeConfig('telegram')
 *
 * // Clear all configs
 * clearConfig()
 * ```
 */
export function useExternalIntegrationConfig(): UseExternalIntegrationConfigReturn {
  const config = useUnit($executionExternalIntegrationConfig)

  const setConfig = useCallback((key: string, value: any) => {
    addExternalIntegrationConfigEvent({ key, value })
  }, [])

  const removeConfig = useCallback((key: string) => {
    removeExternalIntegrationConfigEvent({ key })
  }, [])

  const clearConfig = useCallback(() => {
    clearExternalIntegrationConfigEvent()
  }, [])

  const getConfig = useCallback((key: string) => {
    return config.get(key)
  }, [config])

  const hasConfig = useCallback((key: string) => {
    return config.has(key)
  }, [config])

  const getConfigKeys = useCallback(() => {
    return Array.from(config.keys())
  }, [config])

  const setMultipleConfigs = useCallback((configs: ExternalIntegrationConfig) => {
    Object.entries(configs).forEach(([key, value]) => {
      addExternalIntegrationConfigEvent({ key, value })
    })
  }, [])

  const configObject = useCallback(() => {
    return Object.fromEntries(config.entries())
  }, [config])

  return {
    config,
    configObject: configObject(),
    setConfig,
    removeConfig,
    clearConfig,
    getConfig,
    hasConfig,
    getConfigKeys,
    setMultipleConfigs,
  }
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createEvent, createStore } from 'effector'

// Events
export const setSession = createEvent<string>()
export const clearSession = createEvent()

// Store
export const $session = createStore<string | null>(null)
  .on(setSession, (_, session) => session)
  .reset(clearSession)

// Session providers - functions that return session tokens
export const sessionProviders = {
  // For ArchAI users - loads from localStorage
  archAI: (): string => {
    try {
      const stored = localStorage.getItem('archai-config')
      if (stored) {
        const config = JSON.parse(stored)
        return config.userSession || 'dev'
      }
    } catch (error) {
      console.error('[Session] Failed to load ArchAI session:', error)
    }
    return 'dev'
  },

  // For environment variable users
  env: (): string => {
    return import.meta.env.VITE_CHAINGRAPH_SESSION_TOKEN
      || import.meta.env.VITE_SESSION_TOKEN
      || 'dev'
  },

  // For development
  dev: (): string => 'dev',

  // For custom async session loading
  async: async (loader: () => Promise<string>): Promise<string> => {
    try {
      return await loader()
    } catch (error) {
      console.error('[Session] Failed to load async session:', error)
      return 'dev'
    }
  },
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Secure session hashing utility using Web Crypto API
 */
async function hashSession(session: string): Promise<string> {
  if (!session)
    return 'anonymous'

  try {
    // Use SubtleCrypto for secure hashing
    const encoder = new TextEncoder()
    const data = encoder.encode(session)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Return truncated hash for key purposes (first 16 characters)
    return hashHex.substring(0, 16)
  } catch (error) {
    console.warn('[InitTracker] Failed to hash session, using fallback:', error)
    // Fallback to simple hash if crypto API not available
    let hash = 0
    for (let i = 0; i < session.length; i++) {
      const char = session.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 16)
  }
}

/**
 * Creates a secure connection key from configuration
 */
export async function createConnectionKey(config: {
  trpcURL: string
  sessionBadAI?: string
}): Promise<string> {
  const sessionHash = await hashSession(config.sessionBadAI || '')
  return `${config.trpcURL}-${sessionHash}`
}

/**
 * Initialization Tracker for managing singleton initialization across React remounts
 */
class InitializationTracker {
  private instances = new Map<string, Promise<void>>()
  private callbacks = new Map<string, Set<() => void>>()
  private initializationKeys = new WeakMap<object, string>()
  private resolvedKeys = new Set<string>()
  private rejectedKeys = new Set<string>()

  /**
   * Track initialization promise for a given key
   */
  track(key: object | symbol, initPromise: Promise<void>): Promise<void> {
    const keyString = this.getKeyString(key)

    if (this.instances.has(keyString)) {
      console.log('[InitTracker] Reusing existing initialization for key:', keyString)
      return this.instances.get(keyString)!
    }

    console.log('[InitTracker] Tracking new initialization for key:', keyString)
    this.instances.set(keyString, initPromise)

    // Handle completion and cleanup callbacks with proper state tracking
    initPromise
      .then(() => {
        console.log('[InitTracker] Initialization completed for key:', keyString)
        this.resolvedKeys.add(keyString)
        this.rejectedKeys.delete(keyString) // Clear any previous failure
        this.executeCallbacks(keyString)
      })
      .catch((error) => {
        console.error('[InitTracker] Initialization failed for key:', keyString, error)
        this.rejectedKeys.add(keyString)
        this.resolvedKeys.delete(keyString) // Clear any previous success
        // Clean up failed initialization so it can be retried
        this.instances.delete(keyString)
      })

    return initPromise
  }

  /**
   * Get existing initialization promise for a key
   */
  getPromise(key: object | symbol): Promise<void> | null {
    const keyString = this.getKeyString(key)
    return this.instances.get(keyString) || null
  }

  /**
   * Check if initialization is complete for a key (fixed synchronous check)
   */
  isInitialized(key: object | symbol): boolean {
    const keyString = this.getKeyString(key)
    return this.resolvedKeys.has(keyString)
  }

  /**
   * Check if initialization is currently in progress for a key
   */
  isInitializing(key: object | symbol): boolean {
    const keyString = this.getKeyString(key)
    return this.instances.has(keyString) && !this.resolvedKeys.has(keyString) && !this.rejectedKeys.has(keyString)
  }

  /**
   * Check if initialization failed for a key
   */
  isFailed(key: object | symbol): boolean {
    const keyString = this.getKeyString(key)
    return this.rejectedKeys.has(keyString)
  }

  /**
   * Get the current status of initialization for a key
   */
  getStatus(key: object | symbol): 'not-started' | 'initializing' | 'initialized' | 'failed' {
    const keyString = this.getKeyString(key)

    if (this.resolvedKeys.has(keyString)) {
      return 'initialized'
    }

    if (this.rejectedKeys.has(keyString)) {
      return 'failed'
    }

    if (this.instances.has(keyString)) {
      return 'initializing'
    }

    return 'not-started'
  }

  /**
   * Register callback to execute when initialization completes
   */
  onComplete(key: object | symbol, callback: () => void): () => void {
    const keyString = this.getKeyString(key)

    // If already initialized, execute callback immediately
    if (this.isInitialized(key)) {
      callback()
      return () => {} // No-op cleanup
    }

    if (!this.callbacks.has(keyString)) {
      this.callbacks.set(keyString, new Set())
    }

    const callbackSet = this.callbacks.get(keyString)!
    callbackSet.add(callback)

    // Return cleanup function
    return () => {
      callbackSet.delete(callback)
      if (callbackSet.size === 0) {
        this.callbacks.delete(keyString)
      }
    }
  }

  /**
   * Clear initialization state for a key (useful for testing)
   */
  reset(key: object | symbol): void {
    const keyString = this.getKeyString(key)
    this.instances.delete(keyString)
    this.callbacks.delete(keyString)
    this.resolvedKeys.delete(keyString)
    this.rejectedKeys.delete(keyString)
    console.log('[InitTracker] Reset state for key:', keyString)
  }

  /**
   * Clear all initialization state
   */
  resetAll(): void {
    this.instances.clear()
    this.callbacks.clear()
    this.resolvedKeys.clear()
    this.rejectedKeys.clear()
    this.initializationKeys = new WeakMap()
    console.log('[InitTracker] Reset all state')
  }

  /**
   * Get debugging information
   */
  getDebugInfo(): {
    activeInitializations: string[]
    pendingCallbacks: Record<string, number>
  } {
    return {
      activeInitializations: Array.from(this.instances.keys()),
      pendingCallbacks: Object.fromEntries(
        Array.from(this.callbacks.entries()).map(([key, callbacks]) => [key, callbacks.size]),
      ),
    }
  }

  /**
   * Get or create string key for object or symbol
   */
  private getKeyString(key: object | symbol): string {
    // Handle symbols directly
    if (typeof key === 'symbol') {
      return key.toString()
    }
    if (this.initializationKeys.has(key)) {
      return this.initializationKeys.get(key)!
    }

    // Create unique key string
    const keyString = `init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.initializationKeys.set(key, keyString)
    return keyString
  }

  /**
   * Execute all callbacks for a key
   */
  private executeCallbacks(keyString: string): void {
    const callbacks = this.callbacks.get(keyString)
    if (!callbacks)
      return

    callbacks.forEach((callback) => {
      try {
        callback()
      } catch (error) {
        console.error('[InitTracker] Callback execution failed:', error)
      }
    })

    // Clean up callbacks after execution
    this.callbacks.delete(keyString)
  }
}

// Singleton instance
export const initTracker = new InitializationTracker()

// Default initialization key for simple usage
export const DEFAULT_INIT_KEY = { __chaingraphDefaultKey: true } as const

// Export for testing
export { InitializationTracker }

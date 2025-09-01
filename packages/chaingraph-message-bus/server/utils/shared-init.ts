/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { setMaxListeners } from 'node:events'
import process from 'node:process'
import { initializeNodes } from '@badaitech/chaingraph-nodes'
import { registerSuperjsonTransformers } from '@badaitech/chaingraph-types'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import {
  ExecutionEventImpl,
  getSuperJSONInstance,
} from '@badaitech/chaingraph-types'
import SuperJSON from 'superjson'
// import SuperJSON from 'superjson'
import { createLogger } from './logger'

const logger = createLogger('shared-init')

// Export commonly used items
export const sharedSuperjson = getSuperJSONInstance()

// Singleton pattern to ensure single initialization
class SharedInitializer {
  private static instance: SharedInitializer
  private initialized = false
  public superjson: typeof SuperJSON = SuperJSON
  public ExecutionEventImpl = ExecutionEventImpl

  private constructor() {}

  static getInstance(): SharedInitializer {
    if (!SharedInitializer.instance) {
      SharedInitializer.instance = new SharedInitializer()
    }
    return SharedInitializer.instance
  }

  initialize(): void {
    if (this.initialized) {
      logger.debug('Already initialized, skipping')
      return
    }

    logger.info('Initializing shared components')

    setMaxListeners(100000)
    process.setMaxListeners(0)

    initializeNodes((nodeRegistry) => {
      NodeRegistry.setInstance(nodeRegistry as any)
      logger.info('Node types initialized')
    })

    registerSuperjsonTransformers(this.superjson, NodeRegistry.getInstance())
    logger.info('SuperJSON transformers registered')

    this.initialized = true
  }

  getSuperjson(): typeof SuperJSON {
    if (!this.initialized) {
      this.initialize()
    }
    return this.superjson
  }

  getNodeRegistry(): typeof NodeRegistry {
    if (!this.initialized) {
      this.initialize()
    }
    return NodeRegistry
  }
}

// Export singleton instance
export const sharedInit = SharedInitializer.getInstance()

// Initialize on import
sharedInit.initialize()

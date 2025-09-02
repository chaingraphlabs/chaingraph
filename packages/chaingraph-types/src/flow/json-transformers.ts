/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../port'
import SuperJSON from 'superjson'
import { NodeRegistry } from '../decorator'
import { registerEdgeTransformers } from '../edge'
import { BasePort, PortFactory } from '../port'
import { ExecutionEventImpl } from './execution-events'
import { Flow } from './flow'

/**
 * Registers flow transformers with SuperJSON
 */
export function registerFlowTransformers(
  superjsonCustom: typeof SuperJSON = SuperJSON,
  nodeRegistry: NodeRegistry = NodeRegistry.getInstance(),
) {
  superjsonCustom.registerCustom<IPort, any>(
    {
      isApplicable: (v): v is IPort => {
        return v instanceof BasePort
      },
      serialize: (v) => {
        return v.serialize()
      },
      deserialize: (v) => {
        const port = PortFactory.createFromConfig(v.config)
        return port.deserialize(v)
      },
    },
    'BasePort',
  )

  // Flow
  superjsonCustom.registerCustom<Flow, any>(
    {
      isApplicable: (v): v is Flow => {
        return v instanceof Flow
      },
      serialize: (v) => {
        return v.serialize()
      },
      deserialize: (v) => {
        try {
          // Deserialize flow from JSON string
          return Flow.deserialize(v, nodeRegistry) as Flow
        } catch (e) {
          console.error('Failed to deserialize flow', e)
          throw e
        }
      },
    },
    'Flow',
  )

  // Execution event data
  superjsonCustom.registerCustom<ExecutionEventImpl, any>(
    {
      isApplicable: (v): v is ExecutionEventImpl => {
        return v instanceof ExecutionEventImpl
      },
      serialize: (v) => {
        return {
          index: v.index,
          type: v.type,
          timestamp: v.timestamp,
          data: superjsonCustom.stringify(v.data),
        }
      },
      deserialize: (v) => {
        try {
          const data = superjsonCustom.parse(v.data)

          return new ExecutionEventImpl(
            v.index,
            v.type,
            v.timestamp,
            data,
          )
        } catch (e) {
          console.error('Failed to deserialize execution event', e)
          throw e
        }
      },
    },
    'ExecutionEventImpl',
  )

  registerEdgeTransformers(superjsonCustom)
}

export function getSuperJSONInstance(
  superjsonCustom?: typeof SuperJSON,
): typeof SuperJSON {
  return superjsonCustom ?? SuperJSON
}

export function getNodeRegistryInstance(
  nodeRegistry?: NodeRegistry,
): NodeRegistry {
  return nodeRegistry ?? NodeRegistry.getInstance()
}

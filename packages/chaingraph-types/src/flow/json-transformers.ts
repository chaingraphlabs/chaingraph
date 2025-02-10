/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../port'
import SuperJSON from 'superjson'
import { registerEdgeTransformers } from '../edge'
import { BasePort, PortFactory } from '../port'
import { ExecutionEventImpl } from './execution-events'
import { Flow } from './flow'

/**
 * Registers flow transformers with SuperJSON
 */
export function registerFlowTransformers() {
  SuperJSON.registerCustom<IPort, any>(
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
  SuperJSON.registerCustom<Flow, any>(
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
          return Flow.deserialize(v) as Flow
        } catch (e) {
          console.error('Failed to deserialize flow', e)
          debugger
          throw e
        }
      },
    },
    'Flow',
  )

  // Execution event data
  SuperJSON.registerCustom<ExecutionEventImpl, any>(
    {
      isApplicable: (v): v is ExecutionEventImpl<any> => {
        return v instanceof ExecutionEventImpl
      },
      serialize: (v) => {
        return {
          index: v.index,
          type: v.type,
          timestamp: v.timestamp,
          data: SuperJSON.stringify(v.data),
        }
      },
      deserialize: (v) => {
        const data = SuperJSON.parse(v.data)

        return new ExecutionEventImpl(
          v.index,
          v.type,
          v.timestamp,
          data,
        )
      },
    },
    'ExecutionEventImpl',
  )

  registerEdgeTransformers()
}

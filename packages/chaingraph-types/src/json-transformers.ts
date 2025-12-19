/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import SuperJSON from 'superjson'
import { NodeRegistry } from './decorator'
import { registerFlowTransformers } from './flow'
import { getTransformerTraceCallbacks } from './json-transformers-trace'
import { registerNodeTransformers } from './node'
import { MultiChannel } from './utils'

// Re-export trace types and functions
export type { TransformerTraceCallbacks } from './json-transformers-trace'
export { getTransformerTraceCallbacks, setTransformerTraceCallbacks } from './json-transformers-trace'

/**
 * Registers SuperJSON transformers
 */
export function registerSuperjsonTransformers(
  superjsonCustom: typeof SuperJSON = SuperJSON,
  nodeRegistry: NodeRegistry = NodeRegistry.getInstance(),
): void {
  superjsonCustom.registerCustom<MultiChannel<any>, any>(
    {
      isApplicable: (v): v is MultiChannel<any> => {
        return v instanceof MultiChannel
      },
      serialize: (v) => {
        return v.serialize()
      },
      deserialize: (v) => {
        const traceCallbacks = getTransformerTraceCallbacks()
        const spanId = traceCallbacks?.onDeserializeStart?.('MultiChannel')
        const result = MultiChannel.deserialize(v)
        traceCallbacks?.onDeserializeEnd?.(spanId ?? null)
        return result
      },
    },
    'MultiChannel',
  )

  registerNodeTransformers(nodeRegistry, superjsonCustom)
  registerFlowTransformers(superjsonCustom, nodeRegistry)
}

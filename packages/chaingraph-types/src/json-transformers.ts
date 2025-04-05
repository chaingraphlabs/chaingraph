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
import { registerNodeTransformers } from './node'
import { MultiChannel } from './utils'

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
        return MultiChannel.deserialize(v)
      },
    },
    'MultiChannel',
  )

  registerNodeTransformers(nodeRegistry, superjsonCustom)
  registerFlowTransformers(superjsonCustom)
}

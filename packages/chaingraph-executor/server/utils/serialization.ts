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
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { registerSuperjsonTransformers } from '@badaitech/chaingraph-types'
import SuperJSON from 'superjson'

setMaxListeners(100000)
process.setMaxListeners(0)
// setupPolyfills()
initializeNodes((nodeRegistry) => {
  NodeRegistry.setInstance(nodeRegistry)
})
registerSuperjsonTransformers(SuperJSON, NodeRegistry.getInstance())

/**
 * Safe serialization that handles cyclic structures
 * by removing circular references
 */
export function safeSuperJSONStringify(obj: any): string {
  // Now use superjson to handle the cleaned object
  return JSON.stringify(SuperJSON.serialize(obj))
}

/**
 * Parse superjson string safely
 */
export function safeSuperJSONParse<T = any>(str: string): T {
  return SuperJSON.deserialize(JSON.parse(str))
}
// export function safeSuperJSONParse<T = any>(str: string): T | undefined {
//   try {
//     const parsed = JSON.parse(str)
//     // The parsed object should have json and meta fields for SuperJSON
//     if (!parsed || typeof parsed !== 'object') {
//       console.warn('Parsed value is not an object:', parsed)
//       return undefined
//     }
//
//     // SuperJSON expects {json: ..., meta: ...} structure
//     if (!('json' in parsed)) {
//       // If it doesn't have the SuperJSON structure, return it as-is
//       // This handles plain JSON that wasn't serialized with SuperJSON
//       return parsed as T
//     }
//
//     return SuperJSON.deserialize(parsed) as T
//   } catch (error) {
//     console.error('Failed to parse SuperJSON:', error instanceof Error ? error.message : error)
//     console.error('Input string (first 200 chars):', str.substring(0, 200))
//     return undefined
//   }
// }

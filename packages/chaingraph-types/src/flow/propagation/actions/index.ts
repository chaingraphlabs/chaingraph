/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export { ArrayConfigTransferAction } from './ArrayConfigTransferAction'
export { SchemaTransferAction } from './SchemaTransferAction'
export { TypeAdaptationAction } from './TypeAdaptationAction'
export { ValuePropagationAction } from './ValuePropagationAction'

import type { PropagationAction } from '../types'
import { ArrayConfigTransferAction } from './ArrayConfigTransferAction'
import { SchemaTransferAction } from './SchemaTransferAction'
import { TypeAdaptationAction } from './TypeAdaptationAction'
import { ValuePropagationAction } from './ValuePropagationAction'

/**
 * Registry of all available propagation actions
 * Order matters: actions are executed in the order they appear in this array
 */
export const actionRegistry: PropagationAction[] = [
  new TypeAdaptationAction(), // Handle type adaptation first
  new SchemaTransferAction(), // Then schema transfers
  new ArrayConfigTransferAction(), // Then array config transfers
  new ValuePropagationAction(), // Finally propagate values
]

/**
 * Get all registered actions
 */
export function getRegisteredActions(): PropagationAction[] {
  return [...actionRegistry]
}

/**
 * Get action by name
 */
export function getActionByName(name: string): PropagationAction | undefined {
  return actionRegistry.find(action => action.name === name)
}

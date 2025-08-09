/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export { TransferRulesAction } from './TransferRulesAction'

import type { PropagationAction } from '../types'
import { TransferRulesAction } from './TransferRulesAction'

/**
 * Registry of all available propagation actions
 * Now uses the unified TransferRulesAction that handles all transfer types
 */
export const actionRegistry: PropagationAction[] = [
  new TransferRulesAction(), // Unified action using Transfer Rules System
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

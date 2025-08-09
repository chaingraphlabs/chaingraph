/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IEdge } from '../../edge'
import type { INode } from '../../node'
import type { IPort } from '../../port'
import type { FlowEvent } from '../events'
import type { IFlow } from '../interface'

/**
 * Context provided to propagation actions
 */
export interface ActionContext {
  /** The flow event that triggered this action */
  event: FlowEvent
  /** The flow instance */
  flow: IFlow
  /** Source port (optional, depends on event type) */
  sourcePort?: IPort
  /** Target port (optional, depends on event type) */
  targetPort?: IPort
  /** Edge (optional, for edge-related events) */
  edge?: IEdge
  /** Source node (optional) */
  sourceNode?: INode
  /** Target node (optional) */
  targetNode?: INode
}

/**
 * Interface for propagation actions
 * Each action handles a specific propagation pattern
 */
export interface PropagationAction {
  /** Unique name for the action */
  readonly name: string

  /**
   * Check if this action can execute given the context
   * @param context The action context
   * @returns true if the action can execute
   */
  canExecute: (context: ActionContext) => boolean

  /**
   * Execute the propagation action
   * @param context The action context
   */
  execute: (context: ActionContext) => void | Promise<void>
}

/**
 * Type guard to check if an object implements PropagationAction
 */
export function isPropagationAction(obj: unknown): obj is PropagationAction {
  return (
    obj !== null
    && typeof obj === 'object'
    && 'name' in obj
    && 'canExecute' in obj
    && 'execute' in obj
    && typeof (obj as any).name === 'string'
    && typeof (obj as any).canExecute === 'function'
    && typeof (obj as any).execute === 'function'
  )
}

/**
 * Result of action execution
 */
export interface ActionResult {
  /** Whether the action was executed */
  executed: boolean
  /** Optional error if execution failed */
  error?: Error
  /** Optional message */
  message?: string
}

/**
 * Options for action execution
 */
export interface ActionExecutionOptions {
  /** Whether to throw on errors (default: false) */
  throwOnError?: boolean
  /** Whether to log execution details (default: false) */
  verbose?: boolean
}

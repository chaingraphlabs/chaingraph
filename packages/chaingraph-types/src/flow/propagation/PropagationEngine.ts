/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowEvent } from '../events'
import type { IFlow } from '../interface'
import type { ActionContext, ActionExecutionOptions, ActionResult, PropagationAction } from './types'
import { getRegisteredActions } from './actions'

/**
 * Engine that orchestrates propagation actions based on flow events
 */
export class PropagationEngine {
  private actions: PropagationAction[]
  private readonly options: ActionExecutionOptions

  constructor(actions?: PropagationAction[], options: ActionExecutionOptions = {}) {
    this.actions = actions || getRegisteredActions()
    this.options = {
      throwOnError: false,
      verbose: false,
      ...options,
    }
  }

  /**
   * Handle a flow event by executing applicable actions
   * @param event The flow event to handle
   * @param flow The flow instance
   * @returns Array of action results
   */
  async handleEvent(event: FlowEvent, flow: IFlow): Promise<ActionResult[]> {
    const results: ActionResult[] = []

    // Create base context
    const context: ActionContext = {
      event,
      flow,
    }

    // Execute each action that can handle this event
    for (const action of this.actions) {
      const result = await this.executeAction(action, context)
      results.push(result)

      if (result.error && this.options.throwOnError) {
        throw result.error
      }
    }

    return results
  }

  /**
   * Execute a single action
   * @param action The action to execute
   * @param context The action context
   * @returns The action result
   */
  private async executeAction(action: PropagationAction, context: ActionContext): Promise<ActionResult> {
    try {
      // Check if action can execute
      if (!action.canExecute(context)) {
        return {
          executed: false,
          message: `Action ${action.name} skipped - preconditions not met`,
        }
      }

      if (this.options.verbose) {
        console.log(`[PropagationEngine] Executing action: ${action.name}`)
      }

      // Execute the action
      const res = action.execute(context)
      if (res instanceof Promise) {
        await res
      }

      return {
        executed: true,
        message: `Action ${action.name} executed successfully`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[PropagationEngine] Error in action ${action.name}:`, errorMessage)

      return {
        executed: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        message: `Action ${action.name} failed: ${errorMessage}`,
      }
    }
  }

  /**
   * Add a new action to the engine
   * @param action The action to add
   */
  addAction(action: PropagationAction): void {
    this.actions.push(action)
  }

  /**
   * Remove an action from the engine
   * @param name The name of the action to remove
   * @returns true if the action was removed
   */
  removeAction(name: string): boolean {
    const initialLength = this.actions.length
    this.actions = this.actions.filter(action => action.name !== name)
    return this.actions.length < initialLength
  }

  /**
   * Get all registered actions
   */
  getActions(): PropagationAction[] {
    return [...this.actions]
  }

  /**
   * Clear all actions
   */
  clearActions(): void {
    this.actions = []
  }

  /**
   * Reset to default actions
   */
  resetToDefaults(): void {
    this.actions = getRegisteredActions()
  }
}

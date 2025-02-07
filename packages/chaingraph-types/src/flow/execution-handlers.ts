/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionEventData,
  ExecutionEventEnum,
  ExecutionEventImpl,
} from './execution-events'

/**
 * Type representing a handler function for a specific execution event type
 */
export type ExecutionEventHandler<T extends ExecutionEventEnum> = (
  data: ExecutionEventData[T],
  // context: ExecutionEventImpl<T>['context']
) => void | Promise<void>

/**
 * Map of execution event handlers where keys are event types and values are handler functions
 */
export type ExecutionEventHandlerMap = {
  [K in ExecutionEventEnum]?: ExecutionEventHandler<K>
}

/**
 * Configuration options for execution event handling
 */
export interface HandleExecutionEventOptions {
  /**
   * Whether to ignore errors in handlers (defaults to false)
   */
  ignoreErrors?: boolean

  /**
   * Custom error handler
   */
  onError?: (error: Error, event: ExecutionEventImpl) => void
}

/**
 * Processes an execution event using provided handlers
 *
 * @param event - The execution event to process
 * @param handlers - Map of event handlers
 * @param options - Additional options for event handling
 *
 * @example
 * ```typescript
 * const handlers: ExecutionEventHandlerMap = {
 *   [ExecutionEventEnum.NODE_STARTED]: (data, context) => {
 *     console.log('Node started:', data.node.id)
 *   },
 *   [ExecutionEventEnum.NODE_COMPLETED]: (data, context) => {
 *     console.log('Node completed:', data.node.id, 'in', data.executionTime, 'ms')
 *   }
 * }
 *
 * // Handle single event
 * await handleExecutionEvent(event, handlers)
 * ```
 */
export async function handleExecutionEvent<T extends ExecutionEventEnum>(
  event: ExecutionEventImpl<T>,
  handlers: ExecutionEventHandlerMap,
  options: HandleExecutionEventOptions = {},
): Promise<void> {
  const handler = handlers[event.type] as ExecutionEventHandler<T> | undefined
  if (!handler)
    return

  try {
    // await handler(event.data, event.context)
    await handler(event.data)
  } catch (error) {
    if (options.onError) {
      options.onError(error as Error, event)
    } else if (!options.ignoreErrors) {
      throw error
    }
  }
}

/**
 * Creates a reusable execution event handler with predefined handlers and options
 *
 * @param handlers - Map of event handlers
 * @param options - Additional options for event handling
 * @returns A function that can handle execution events
 *
 * @example
 * ```typescript
 * const handleEvent = createExecutionEventHandler({
 *   [ExecutionEventEnum.FLOW_STARTED]: (data, context) => {
 *     console.log('Flow started:', data.flow.id)
 *   }
 * }, {
 *   onError: (error) => console.error('Handler error:', error)
 * })
 *
 * // Use the handler
 * await handleEvent(event)
 * ```
 */
export function createExecutionEventHandler(
  handlers: ExecutionEventHandlerMap,
  options: HandleExecutionEventOptions = {},
) {
  return (event: ExecutionEventImpl) => handleExecutionEvent(event, handlers, options)
}

/**
 * Helper function to create a strongly-typed handler for a specific execution event type
 *
 * @param type - Execution event type
 * @param handler - Handler function for the event
 * @returns Typed event handler
 *
 * @example
 * ```typescript
 * const handleNodeStarted = createTypedExecutionHandler(
 *   ExecutionEventEnum.NODE_STARTED,
 *   (data, context) => {
 *     console.log('Node started:', data.node.id)
 *     console.log('Execution ID:', context.executionId)
 *   }
 * )
 *
 * // Type-safe usage in handler map
 * const handlers: ExecutionEventHandlerMap = {
 *   [ExecutionEventEnum.NODE_STARTED]: handleNodeStarted
 * }
 * ```
 */
export function createTypedExecutionHandler<T extends ExecutionEventEnum>(
  type: T,
  handler: ExecutionEventHandler<T>,
): ExecutionEventHandler<T> {
  return handler
}

/**
 * Type helper to extract event data type from event enum
 */
export type ExecutionEventDataType<T extends ExecutionEventEnum> = ExecutionEventData[T]

/**
 * Type helper to extract full event type from event enum
 */
export type ExecutionEventType<T extends ExecutionEventEnum> = ExecutionEventImpl<T>

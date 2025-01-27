import type { EventDataMap, FlowEvent, FlowEventType } from './events'

/**
 * Type representing a handler function for a specific flow event type
 */
export type FlowEventHandler<T extends FlowEventType> = (data: EventDataMap[T]) => void | Promise<void>

/**
 * Map of event handlers where keys are event types and values are handler functions
 */
export type FlowEventHandlerMap = {
  [K in FlowEventType]?: FlowEventHandler<K>
}

/**
 * Configuration options for event handling
 */
export interface HandleEventOptions {
  /**
   * Whether to ignore errors in handlers (defaults to false)
   */
  ignoreErrors?: boolean

  /**
   * Custom error handler
   */
  onError?: (error: Error, event: FlowEvent) => void
}

/**
 * Processes a flow event using provided handlers
 *
 * @param event - The flow event to process
 * @param handlers - Map of event handlers
 * @param options - Additional options for event handling
 *
 * @example
 * ```typescript
 * const handlers: FlowEventHandlerMap = {
 *   [FlowEventType.NodeAdded]: (data) => {
 *     console.log('Node added:', data.node.id)
 *   },
 *   [FlowEventType.EdgeRemoved]: (data) => {
 *     console.log('Edge removed:', data.edgeId)
 *   }
 * }
 *
 * // Handle single event
 * await handleFlowEvent(event, handlers)
 * ```
 */
export async function handleFlowEvent<T extends FlowEventType>(
  event: FlowEvent<T>,
  handlers: FlowEventHandlerMap,
  options: HandleEventOptions = {},
): Promise<void> {
  const handler = handlers[event.type] as FlowEventHandler<T> | undefined
  if (!handler)
    return

  try {
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
 * Creates a reusable event handler with predefined handlers and options
 *
 * @param handlers - Map of event handlers
 * @param options - Additional options for event handling
 * @returns A function that can handle flow events
 *
 * @example
 * ```typescript
 * const handleEvent = createEventHandler({
 *   [FlowEventType.NodeAdded]: (data) => {
 *     console.log('Node added:', data.node.id)
 *   }
 * }, {
 *   onError: (error) => console.error('Handler error:', error)
 * })
 *
 * // Use the handler
 * await handleEvent(event)
 * ```
 */
export function createEventHandler(
  handlers: FlowEventHandlerMap,
  options: HandleEventOptions = {},
) {
  return (event: FlowEvent) => handleFlowEvent(event, handlers, options)
}

/**
 * Helper function to create a strongly-typed event handler for a specific event type
 *
 * @param type - Flow event type
 * @param handler - Handler function for the event
 * @returns Typed event handler
 *
 * @example
 * ```typescript
 * const handleNodeAdded = createTypedHandler(
 *   FlowEventType.NodeAdded,
 *   (data) => console.log('Node added:', data.node.id)
 * )
 *
 * // Type-safe usage in handler map
 * const handlers: FlowEventHandlerMap = {
 *   [FlowEventType.NodeAdded]: handleNodeAdded
 * }
 * ```
 */
export function createTypedHandler<T extends FlowEventType>(
  type: T,
  handler: FlowEventHandler<T>,
): FlowEventHandler<T> {
  return handler
}

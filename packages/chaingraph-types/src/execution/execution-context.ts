/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEvent } from '../flow'
import type { INode } from '../node'
import type { EmittedEventContext } from './emitted-event-context'
import type { IntegrationContext } from './integration-context'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { v4 as uuidv4 } from 'uuid'
import { EventQueue } from '../utils'

// Event emitted by nodes for triggering listeners
export interface EmittedEvent {
  id: string
  type: string
  data: any
  emittedAt: number
  emittedBy: string // nodeId
  childExecutionId?: string
  processed?: boolean
}

/**
 * Callback type for port resolution events
 * @param nodeId - The node ID that resolved the port
 * @param portId - The port ID that was resolved
 */
export type OnPortResolvedCallback = (nodeId: string, portId: string) => void

export class ExecutionContext {
  public readonly executionId: string
  public readonly rootExecutionId?: string
  public readonly parentExecutionId?: string
  public readonly userId?: string

  public readonly startTime: Date
  public readonly flowId?: string
  public readonly metadata: Record<string, unknown>
  public readonly abortController: AbortController

  private ecdhKeyPairPromise: Promise<CryptoKeyPair> | null = null

  // debug log events queue
  private readonly eventsQueue: EventQueue<ExecutionEvent>

  // integrations
  public readonly integrations: IntegrationContext

  // Event-driven execution support
  public emittedEvents?: EmittedEvent[]
  public readonly eventData?: EmittedEventContext
  public readonly isChildExecution?: boolean
  public currentNodeId?: string // Track current executing node for event emission
  public readonly executionDepth: number // Track depth to prevent infinite cycles

  public readonly getNodeById: (nodeId: string) => INode | undefined
  // findNode is a utility function to find a node by a predicate
  public readonly findNodes: (predicate: (node: INode) => boolean) => INode[] | undefined

  // Port resolution support - tracks resolved ports using composite keys "nodeId:portId"
  private readonly resolvedPorts: Set<string> = new Set()
  private onPortResolved?: OnPortResolvedCallback

  // TODO: chat api gql client
  // TODO: agent session
  // TODO: chat room meta + participants agents?
  // TODO: input chat message / event / tweet / telegram message / some external events

  // TODO: rewrite the constructor to take a single object parameter
  constructor(
    flowId: string,
    abortController: AbortController,
    metadata?: Record<string, unknown>,
    executionId?: string,
    integrations?: IntegrationContext,
    rootExecutionId?: string,
    parentExecutionId?: string,
    eventData?: EmittedEventContext,
    isChildExecution?: boolean,
    executionDepth?: number,
    getNodeById?: (nodeId: string) => INode | undefined,
    findNodes?: (predicate: (node: INode) => boolean) => INode[] | undefined,
    userId?: string,
    onPortResolved?: OnPortResolvedCallback,
  ) {
    this.executionId = executionId || uuidv4()
    this.startTime = new Date()
    this.flowId = flowId
    this.metadata = metadata || {}
    this.abortController = abortController
    this.integrations = integrations || {}
    this.eventsQueue = new EventQueue<ExecutionEvent>(10)
    this.getNodeById = getNodeById || (() => undefined)
    this.findNodes = findNodes || ((predicate: (node: INode) => boolean) => undefined)

    // Event-driven execution support
    this.parentExecutionId = parentExecutionId
    this.rootExecutionId = rootExecutionId
    this.eventData = eventData
    this.isChildExecution = isChildExecution
    this.executionDepth = executionDepth || 0
    this.userId = userId
    if (this.eventData || this.parentExecutionId) {
      this.emittedEvents = []
    }

    // Port resolution support
    this.onPortResolved = onPortResolved
  }

  get abortSignal(): AbortSignal {
    return this.abortController.signal
  }

  async getECDHKeyPair(): Promise<CryptoKeyPair> {
    if (!this.ecdhKeyPairPromise) {
      this.ecdhKeyPairPromise = globalThis.crypto.subtle.generateKey({
        name: 'ECDH',
        namedCurve: 'P-256',
      }, false, ['deriveKey'])
    }

    return this.ecdhKeyPairPromise
  }

  async sendEvent(event: ExecutionEvent): Promise<void> {
    return this.eventsQueue?.publish(event)
  }

  getEventsQueue(): EventQueue<ExecutionEvent> {
    return this.eventsQueue as EventQueue<ExecutionEvent>
  }

  /**
   * Helper method to get a specific integration by type
   * @param type The integration type to retrieve
   * @returns The integration data or undefined if not found
   */
  getIntegration<T = unknown>(type: string): T | undefined {
    if (!this.integrations || !this.integrations[type]) {
      return undefined
    }
    return this.integrations[type] as T
  }

  /**
   * Emit an event that can trigger listener nodes
   * @param eventType The type of event to emit
   * @param data The event data
   * @param nodeId The ID of the node emitting the event (for tracking)
   */
  emitEvent(eventType: string, data: any, nodeId: string): void {
    if (!this.emittedEvents) {
      this.emittedEvents = []
    }

    this.emittedEvents.push({
      id: `EV${customAlphabet(nolookalikes, 24)()}`,
      type: eventType,
      data,
      emittedAt: Date.now(),
      emittedBy: nodeId || this.currentNodeId || 'unknown',
    })
  }

  /**
   * Clone this context for a child execution
   * @param eventData The event data for the child execution
   * @param childExecutionId The ID for the child execution
   */
  cloneForChildExecution(eventData: EmittedEventContext, childExecutionId: string): ExecutionContext {
    const ctx = new ExecutionContext(
      this.flowId!,
      this.abortController,
      { ...this.metadata, parentExecutionId: this.executionId },
      childExecutionId,
      this.integrations, // Share integrations
      this.rootExecutionId, // Parent execution ID
      this.executionId, // Parent execution ID
      eventData,
      true, // Is child execution
      this.executionDepth + 1,
      this.getNodeById,
      this.findNodes,
      this.userId, // Pass userId to child execution
      this.onPortResolved, // Pass port resolution callback to child
    )
    ctx.ecdhKeyPairPromise = this.ecdhKeyPairPromise // Share key pair promise
    return ctx
  }

  /**
   * Helper to create composite port key for flow-level uniqueness
   * Port IDs are only unique within a node, so we use "nodeId:portId" format
   */
  private portKey(nodeId: string, portId: string): string {
    return `${nodeId}:${portId}`
  }

  /**
   * Mark a port as resolved, allowing downstream nodes to begin execution.
   * Uses the port ID (which equals the key/path for root ports, e.g., "outputStream"
   * or "object.field" for nested ports).
   *
   * @param portId The port ID (equals key for root ports, path for nested ports)
   * @throws Error if called outside of node execution or port not found
   */
  resolvePort(portId: string): void {
    if (!this.currentNodeId) {
      throw new Error('Cannot resolve port outside of node execution')
    }

    const node = this.getNodeById(this.currentNodeId)
    if (!node) {
      throw new Error(`Current node ${this.currentNodeId} not found`)
    }

    // Get port by ID (for root ports, ID === key)
    const port = node.getPort(portId)
    if (!port) {
      throw new Error(`Port with ID '${portId}' not found on node ${this.currentNodeId}`)
    }

    const compositeKey = this.portKey(this.currentNodeId, port.id)
    if (this.resolvedPorts.has(compositeKey)) {
      return // Already resolved
    }

    this.resolvedPorts.add(compositeKey)
    this.onPortResolved?.(this.currentNodeId, port.id)
  }

  /**
   * Check if a port is resolved.
   * Uses the port ID (which equals the key/path for root ports).
   *
   * @param portId The port ID (equals key for root ports, path for nested ports)
   * @returns true if the port is resolved, false otherwise
   */
  isPortResolved(portId: string): boolean {
    if (!this.currentNodeId) {
      return false
    }

    const node = this.getNodeById(this.currentNodeId)
    if (!node) {
      return false
    }

    const port = node.getPort(portId)
    if (!port) {
      return false
    }

    const compositeKey = this.portKey(this.currentNodeId, port.id)
    return this.resolvedPorts.has(compositeKey)
  }

  /**
   * Set the port resolution callback.
   * This is called by the execution engine to receive port resolution events.
   *
   * @param callback The callback to invoke when a port is resolved
   */
  setOnPortResolved(callback: OnPortResolvedCallback): void {
    this.onPortResolved = callback
  }
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEvent } from '../flow'
import { subtle } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import { EventQueue } from '../utils'

export interface BadAIContext {
  agentID?: string
  agentSession?: string
  chatID?: string
  messageID?: number
}

export class ExecutionContext {
  public readonly executionId: string
  public readonly startTime: Date
  public readonly flowId?: string
  public readonly metadata: Record<string, unknown>
  public readonly abortController: AbortController

  private ecdhKeyPair?: CryptoKeyPair | null = null

  // debug log events queue
  private readonly eventsQueue: EventQueue<ExecutionEvent>

  // integrations
  public readonly badAIContext?: BadAIContext

  // TODO: chat api gql client
  // TODO: agent session
  // TODO: chat room meta + participants agents?
  // TODO: input chat message / event / tweet / telegram message / some external events

  constructor(
    flowId: string,
    abortController: AbortController,
    metadata?: Record<string, unknown>,
    executionId?: string,
    badAIContext?: BadAIContext,
  ) {
    this.executionId = executionId || uuidv4()
    this.startTime = new Date()
    this.flowId = flowId
    this.metadata = metadata || {}
    this.abortController = abortController
    this.badAIContext = badAIContext
    this.eventsQueue = new EventQueue<ExecutionEvent>(10)
  }

  get abortSignal(): AbortSignal {
    return this.abortController.signal
  }

  private async generateECDHKeyPair() {
    this.ecdhKeyPair = await subtle.generateKey({
      name: 'ECDH',
      namedCurve: 'P-256',
    }, false, ['deriveKey'])
  }

  async getECDHKeyPair(): Promise<CryptoKeyPair> {
    if (this.ecdhKeyPair === null || this.ecdhKeyPair === undefined) {
      await this.generateECDHKeyPair()
    }

    return this.ecdhKeyPair!
  }

  async sendEvent(event: ExecutionEvent): Promise<void> {
    return this.eventsQueue?.publish(event)
  }

  getEventsQueue(): EventQueue<ExecutionEvent> {
    return this.eventsQueue as EventQueue<ExecutionEvent>
  }
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { subtle } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'

export class ExecutionContext {
  public readonly executionId: string
  public readonly startTime: Date
  public readonly flowId?: string
  public readonly metadata: Record<string, unknown>
  public readonly abortController: AbortController

  private ecdhKeyPair: CryptoKeyPair | null = null

  constructor(
    flowId: string,
    abortController: AbortController,
    metadata?: Record<string, unknown>,
    executionId?: string,
  ) {
    this.executionId = executionId || uuidv4()
    this.startTime = new Date()
    this.flowId = flowId
    this.metadata = metadata || {}
    this.abortController = abortController
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
    if (this.ecdhKeyPair === null) {
      await this.generateECDHKeyPair()
    }

    return this.ecdhKeyPair as CryptoKeyPair
  }
}

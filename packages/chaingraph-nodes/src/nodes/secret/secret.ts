/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  EncryptedSecretValue,
  ExecutionContext,
  NodeExecutionResult,
  SecretType,
} from '@badaitech/chaingraph-types'
import { Buffer } from 'node:buffer'
import { subtle } from 'node:crypto'
import { GraphQL, graphQLClient } from '@badaitech/badai-api'
import { BaseNode, Input, isSupportedSecretType, Node, Output, Secret, String, wrapSecret } from '@badaitech/chaingraph-types'

@Node({})
export class SecretNode extends BaseNode {
  @Input()
  @String()
  secretID: string | null = null

  @Output()
  @Secret()
  secret?: EncryptedSecretValue<SecretType>

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.secretID) {
      throw new Error('No secretID provided')
    }

    const keyPair = await context.getECDHKeyPair()
    const { secret } = await graphQLClient.request(GraphQL.ReadSecretDocument, {
      id: this.secretID,
      publicKey: Buffer.from(await subtle.exportKey('raw', keyPair.publicKey)).toString('base64'),
      session: '',
    })

    const secretType = secret.secret.metadata.type
    if (!isSupportedSecretType(secretType)) {
      throw new Error(`Unknown secret type ${secretType}`)
    }

    const publicKey = await subtle.importKey('raw', Buffer.from(secret.publicKey, 'base64'), {
      name: 'ECDH',
      namedCurve: 'P-256',
    }, false, [])
    const buffer = Buffer.from(secret.secret.encrypted, 'base64')

    const encrypted = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length)
    this.secret = wrapSecret(secretType, {
      encrypted,
      publicKey,
    })

    return {}
  }
}

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
} from '@badaitech/chaingraph-types'
import { Buffer } from 'node:buffer'
import { subtle } from 'node:crypto'
import {
  BaseNode,
  Input,
  Node,
  Output,
  Secret,
  String,
  wrapSecret,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Direct Secret',
  description: 'Converts sensitive text input (such as API keys or passwords) directly into an encrypted secret. Unlike the Secret node, this takes raw text rather than a reference ID. Use this when you need to immediately encrypt sensitive information without storing it in the secret management panel first.',
  category: NODE_CATEGORIES.SECRET,
  tags: ['secret', 'encryption', 'security', 'api-keys', 'passwords', 'sensitive-data'],
})
export class DirectSecret extends BaseNode {
  @Input()
  @String({
    title: 'Sensitive Value',
    description: 'Enter the sensitive text (API key, password, token, etc.) that you want to encrypt. This value will be converted directly into an encrypted secret and will be visually masked for security.',
    ui: {
      hidePort: true,
      isPassword: true,
    },
  })
  value?: string

  @Output()
  @Secret<'string'>({
    title: 'Encrypted Secret',
    description: 'The input value encrypted as a secure secret that can be safely passed between nodes. This encrypted format protects sensitive information while allowing it to be used by compatible nodes in your workflow.',
    secretType: 'string',
  })
  secret?: EncryptedSecretValue<'string'>

  async execute(ctx: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.value) {
      throw new Error(`No value provided`)
    }

    const keyPair = await ctx.getECDHKeyPair()

    const remoteKeyPair = await subtle.generateKey({
      name: 'ECDH',
      namedCurve: 'P-256',
    }, false, ['deriveKey'])
    const remotePublicKey = await subtle.exportKey('raw', remoteKeyPair.publicKey)

    const encryptionKey = await subtle.deriveKey({
      name: 'ECDH',
      public: keyPair.publicKey,
    }, remoteKeyPair.privateKey, {
      name: 'AES-GCM',
      length: 256,
    }, false, ['encrypt'])

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = new TextEncoder().encode(JSON.stringify(this.value))

    const encrypted = await subtle.encrypt({
      name: 'AES-GCM',
      length: 256,
      iv,
    }, encryptionKey, data)

    this.secret = wrapSecret('string', {
      encrypted: Buffer.concat([iv, Buffer.from(encrypted)]).toString('base64'),
      publicKey: Buffer.from(remotePublicKey).toString('base64'),
    })

    return {}
  }
}

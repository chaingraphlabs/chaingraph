/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { SecretPortConfig } from '../base'
import { Buffer } from 'node:buffer'
import { subtle } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { ExecutionContext } from '../../execution'
import { wrapSecret } from '../base/secret'
import { SecretPortPlugin } from '../plugins'

describe('secret port', () => {
  it('should serialize and deserialize', async () => {
    const remoteKeyPair = await subtle.generateKey({
      name: 'ECDH',
      namedCurve: 'P-256',
    }, false, ['deriveKey'])
    const remotePublicKey = await subtle.exportKey('raw', remoteKeyPair.publicKey)

    const abortController = new AbortController()
    const ctx = new ExecutionContext('', abortController)

    const keyPair = await ctx.getECDHKeyPair()

    const encryptionKey = await subtle.deriveKey({
      name: 'ECDH',
      public: keyPair.publicKey,
    }, remoteKeyPair.privateKey, {
      name: 'AES-GCM',
      length: 256,
    }, false, ['encrypt'])

    const apiKey = { key: 'a', secretKey: 'b' }

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = new TextEncoder().encode(JSON.stringify(apiKey))

    const encrypted = await subtle.encrypt({
      name: 'AES-GCM',
      length: 256,
      iv,
    }, encryptionKey, data)

    const value = wrapSecret('xApp', {
      encrypted: Buffer.concat([iv, Buffer.from(encrypted)]).toString('base64'),
      publicKey: Buffer.from(remotePublicKey).toString('base64'),
    })

    const config = {
      type: 'secret',
      secretType: 'xApp',
      defaultValue: undefined,
    } satisfies SecretPortConfig<'xApp'>

    // TODO: remove "any" cast
    const jsonValue = SecretPortPlugin.serializeValue(value as any, config)
    const deserialized = SecretPortPlugin.deserializeValue(jsonValue, config)

    expect(deserialized.publicKey).toBe(value.publicKey)
    expect(deserialized.encrypted).toBe(value.encrypted)

    const decrypted = await value.decrypt(ctx)
    expect(decrypted).toEqual(apiKey)
  })
})

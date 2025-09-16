/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { SecretPortConfig } from '../base'
import { Buffer } from 'node:buffer'
import { randomBytes, subtle } from 'node:crypto'
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

    const sharedSecret = await subtle.deriveKey({
      name: 'ECDH',
      public: keyPair.publicKey,
    }, remoteKeyPair.privateKey, {
      name: 'HKDF',
      hash: 'SHA-256',
      // info: new ArrayBuffer(),
    }, false, ['deriveKey'])

    const nonce = randomBytes(32)

    const encryptionKey = await subtle.deriveKey({
      name: 'HKDF',
      hash: 'SHA-256',
      info: new ArrayBuffer(),
      salt: nonce,
    }, sharedSecret, {
      name: 'AES-GCM',
      length: 256,
    }, false, ['encrypt'])

    const apiKey = { key: 'a', secretKey: 'b' }

    const iv = randomBytes(12)
    const data = new TextEncoder().encode(JSON.stringify(apiKey))

    const encrypted = await subtle.encrypt({
      name: 'AES-GCM',
      length: 256,
      iv,
    }, encryptionKey, data)

    const value = wrapSecret('xApp', {
      encrypted: Buffer.concat([iv, Buffer.from(encrypted)]).toString('base64'),
      hkdfNonce: nonce.toString('base64'),
      publicKey: Buffer.from(remotePublicKey).toString('base64'),
    })

    const config = {
      type: 'secret',
      secretType: 'xApp',
      defaultValue: undefined,
    } satisfies SecretPortConfig<'xApp'>

    const jsonValue = SecretPortPlugin.serializeValue(value, config)
    const deserialized = SecretPortPlugin.deserializeValue(jsonValue, config)

    expect(deserialized.publicKey).toBe(value.publicKey)
    expect(deserialized.encrypted).toBe(value.encrypted)

    const decrypted = await value.decrypt(ctx)
    expect(decrypted).toEqual(apiKey)
  })
})

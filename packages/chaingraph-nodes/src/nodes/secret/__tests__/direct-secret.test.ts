/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { SecretTypeMap } from '@badaitech/chaingraph-types'
import { ExecutionContext } from '@badaitech/chaingraph-types'
import { describe, expect, it } from 'vitest'
import { DirectSecret, DirectSecretXAPI } from '../direct-secret'

describe('direct secret node', () => {
  it('encrypts input', async () => {
    const node = new DirectSecret('')

    node.stringSecret = `API_KEY_"例子"_🔑_"Пример"_مثال_"1234"`

    const abortController = new AbortController()
    const ctx = new ExecutionContext('', abortController)

    await node.execute(ctx)

    expect(await node.encryptedStringSecret!.decrypt(ctx)).toBe(node.stringSecret)
  })

  it('encrypts secret with multiple inputs', async () => {
    const node = new DirectSecretXAPI('')

    const secret: SecretTypeMap['xAPI'] = {
      key: 'test-api-key-123',
      secretKey: 'test-api-key-456',
    }

    node.key = secret.key
    node.secretKey = secret.secretKey

    const abortController = new AbortController()
    const ctx = new ExecutionContext('', abortController)

    await node.execute(ctx)

    const decrypted = await node.encryptedXAPICredentials!.decrypt(ctx)

    expect(decrypted).toEqual(secret)
  })
})

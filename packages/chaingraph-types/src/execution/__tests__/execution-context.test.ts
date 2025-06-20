/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { subtle } from 'node:crypto'
import { setTimeout as sleep } from 'node:timers/promises'
import { describe, expect, it, vi } from 'vitest'
import { ExecutionContext } from '../execution-context'

describe('execution context', () => {
  it('has the same ECDH keypair after multiple calls', async () => {
    const abortController = new AbortController()
    const ctx = new ExecutionContext('', abortController)

    const expected = await ctx.getECDHKeyPair()
    const actual = await ctx.getECDHKeyPair()

    expect(actual).toStrictEqual(expected)
  })

  it('has the same ECDH keypair for concurrent calls', async () => {
    const originalGenerateKey = subtle.generateKey.bind(subtle)

    vi.spyOn(subtle, 'generateKey').mockImplementation(async (...args) => {
      // Introduce a delay to simulate async operation and increase the chance of race condition
      await sleep(10)
      return originalGenerateKey(...args)
    })

    try {
      const abortController = new AbortController()
      const ctx = new ExecutionContext('', abortController)

      const results = await Promise.all([
        ctx.getECDHKeyPair(),
        ctx.getECDHKeyPair(),
        ctx.getECDHKeyPair(),
        ctx.getECDHKeyPair(),
        ctx.getECDHKeyPair(),
      ])

      const expected = await subtle.exportKey('raw', results[0].publicKey)
      for (let i = 1; i < results.length; i++) {
        const actual = await subtle.exportKey('raw', results[i].publicKey)
        expect(actual).toStrictEqual(expected)
      }
    } finally {
      vi.spyOn(subtle, 'generateKey').mockRestore()
    }
  })
})

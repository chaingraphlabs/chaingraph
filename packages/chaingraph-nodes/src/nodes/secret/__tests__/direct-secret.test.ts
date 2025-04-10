/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ExecutionContext } from '@badaitech/chaingraph-types'
import { describe, expect, it } from 'vitest'
import { DirectSecret } from '../direct-secret'

describe('direct secret node', () => {
  it('encrypts input', async () => {
    const node = new DirectSecret('')

    node.value = `API_KEY_"例子"_🔑_"Пример"_مثال_"1234"`

    const abortController = new AbortController()
    const ctx = new ExecutionContext('', abortController)

    await node.execute(ctx)

    expect(await node.secret!.decrypt(ctx)).toBe(node.value)
  })
})

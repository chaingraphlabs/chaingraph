/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { secretTypeSchemas } from '@badaitech/chaingraph-types/port'
import { describe, expect, it } from 'vitest'
import { appRouter } from '../../../router'
import { createTestContext } from '../../../test/utils/createTestContext'
import { createCallerFactory } from '../../../trpc'

describe('secret procedures', () => {
  const createCaller = createCallerFactory(appRouter)

  it('get-secret-types', async () => {
    const ctx = createTestContext()
    const caller = createCaller(ctx)

    const secrets = await caller.secrets.getSecretTypes()
    expect(secrets).toBeDefined()

    const expectedSecretTypes = new Set(Object.keys(secretTypeSchemas))
    expect(new Set(Object.keys(secrets))).toEqual(expectedSecretTypes)
  })
})

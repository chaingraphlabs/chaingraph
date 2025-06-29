/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '@badaitech/chaingraph-types'
import { describe, expect, it } from 'vitest'
import ServerTimeNode from '../server-time.node'

describe('serverTimeNode', () => {
  it('should create a server time node with default values', () => {
    const node = new ServerTimeNode('test-id')
    expect(node.timeFormat).toBe('ISO')
    expect(node.timezone).toBe('UTC')
    expect(node.customFormat).toBe('YYYY-MM-DD HH:mm:ss')
  })

  it('should execute and return current time in ISO format', async () => {
    const node = new ServerTimeNode('test-id-2')
    node.timeFormat = 'ISO'
    node.timezone = 'UTC'

    const mockContext = {} as ExecutionContext
    const result = await node.execute(mockContext)

    expect(result).toEqual({})
    expect(node.formattedTime).toBeTruthy()
    expect(node.timestampSeconds).toBeGreaterThan(0)
    expect(node.timestampMilliseconds).toBeGreaterThan(0)
    expect(node.timestampMilliseconds).toBeGreaterThan(node.timestampSeconds)

    // Check that the ISO format is valid
    expect(node.formattedTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('should execute and return current time in Locale format', async () => {
    const node = new ServerTimeNode('test-id-3')
    node.timeFormat = 'Locale'
    node.timezone = 'UTC'

    const mockContext = {} as ExecutionContext
    const result = await node.execute(mockContext)

    expect(result).toEqual({})
    expect(node.formattedTime).toBeTruthy()
    expect(node.formattedTime).toContain(' ')
    expect(node.formattedTime).toMatch(/\d{4}/)
  })

  it('should execute and return current time in custom format', async () => {
    const node = new ServerTimeNode('test-id-4')
    node.timeFormat = 'Custom'
    node.customFormat = 'YYYY-MM-DD HH:mm:ss'
    node.timezone = 'UTC'

    const mockContext = {} as ExecutionContext
    const result = await node.execute(mockContext)

    expect(result).toEqual({})
    expect(node.formattedTime).toBeTruthy()
    expect(node.formattedTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('should handle different timezones', async () => {
    const node = new ServerTimeNode('test-id-5')
    node.timeFormat = 'Custom'
    node.customFormat = 'YYYY-MM-DD HH:mm:ss'
    node.timezone = 'America/New_York'

    const mockContext = {} as ExecutionContext
    const result = await node.execute(mockContext)

    expect(result).toEqual({})
    expect(node.formattedTime).toBeTruthy()
    expect(node.formattedTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('should handle custom format with month names', async () => {
    const node = new ServerTimeNode('test-id-6')
    node.timeFormat = 'Custom'
    node.customFormat = 'MMM DD, YYYY HH:mm:ss'
    node.timezone = 'UTC'

    const mockContext = {} as ExecutionContext
    const result = await node.execute(mockContext)

    expect(result).toEqual({})
    expect(node.formattedTime).toBeTruthy()
    expect(node.formattedTime).toMatch(/^[A-Z][a-z]{2} \d{2}, \d{4} \d{2}:\d{2}:\d{2}$/)
  })

  it('should handle empty custom format gracefully', async () => {
    const node = new ServerTimeNode('test-id-7')
    node.timeFormat = 'Custom'
    node.customFormat = ''
    node.timezone = 'UTC'

    const mockContext = {} as ExecutionContext
    const result = await node.execute(mockContext)

    expect(result).toEqual({})
    expect(node.formattedTime).toBeTruthy()
    // Should fallback to default custom format
    expect(node.formattedTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('should provide timestamp values that are consistent', async () => {
    const node = new ServerTimeNode('test-id-8')
    node.timeFormat = 'ISO'
    node.timezone = 'UTC'

    const beforeTime = Date.now()
    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)
    const afterTime = Date.now()

    expect(node.timestampMilliseconds).toBeGreaterThanOrEqual(beforeTime)
    expect(node.timestampMilliseconds).toBeLessThanOrEqual(afterTime)
    expect(node.timestampSeconds).toBe(Math.floor(node.timestampMilliseconds / 1000))
  })
})

import { createTestCaller } from '@chaingraph/backend/test/utils'
import { describe, expect, it } from 'vitest'

describe('transform procedures', () => {
  const caller = createTestCaller()

  it('should convert string to uppercase', async () => {
    const result = await caller.toUpperCase('hello')
    expect(result).toBe('HELLO')
  })

  it('should return complex data with correct types', async () => {
    const result = await caller.complexData()

    expect(result).toHaveProperty('date')
    expect(result.date).toBeInstanceOf(Date)
    expect(result.map).toBeInstanceOf(Map)
    expect(result.set).toBeInstanceOf(Set)
    expect(typeof result.bigint).toBe('bigint')
  })
})

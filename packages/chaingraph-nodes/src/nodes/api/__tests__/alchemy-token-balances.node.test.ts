/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '@badaitech/chaingraph-types'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import AlchemyTokenBalances from '../alchemy-token-balances.node'

// Mock fetch globally for unit tests
globalThis.fetch = vi.fn()

describe('alchemyTokenBalances - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create node with default values', () => {
    const node = new AlchemyTokenBalances('test-id')
    expect(node.network).toBe('eth-mainnet')
    expect(node.filterZeroBalances).toBe(true)
    expect(node.walletAddress).toBe('')
    expect(node.contractAddresses).toEqual([])
    expect(node.tokenDecimals).toEqual([])
    expect(node.defaultDecimals).toBe(18)
  })

  it('should make only a single API call for token balances', async () => {
    const node = new AlchemyTokenBalances('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
    } as any

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: {
          tokenBalances: [
            {
              contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              tokenBalance: '0x5f5e100', // 100 USDC (100 * 10^6)
            },
            {
              contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              tokenBalance: '0xde0b6b3a7640000', // 1 DAI (1 * 10^18)
            },
          ],
        },
      }),
    }

    ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)

    // Verify only one API call was made
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    // Verify the call was for token balances, not metadata
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('alchemy_getTokenBalances'),
      }),
    )

    // Should NOT contain any metadata fetching calls
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('alchemy_getTokenMetadata'),
      }),
    )
  })

  it('should use token-specific decimals from array with fallback to default', async () => {
    const node = new AlchemyTokenBalances('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    node.tokenDecimals = [
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }, // USDC
    ]
    node.defaultDecimals = 18
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
    } as any

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: {
          tokenBalances: [
            {
              contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
              tokenBalance: '0x5f5e100', // 100000000 (100 USDC with 6 decimals)
            },
            {
              contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
              tokenBalance: '0xde0b6b3a7640000', // 1 DAI with 18 decimals
            },
          ],
        },
      }),
    }

    ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)

    expect(node.tokenBalances).toHaveLength(2)

    // USDC should use 6 decimals from the array
    const usdcBalance = node.tokenBalances.find(
      t => t.tokenAddress.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    )
    expect(usdcBalance?.balance.decimals).toBe(6)
    expect(usdcBalance?.balance.formatted).toBe('100')

    // DAI should use default 18 decimals
    const daiBalance = node.tokenBalances.find(
      t => t.tokenAddress.toLowerCase() === '0x6b175474e89094c44da98b954eedeac495271d0f',
    )
    expect(daiBalance?.balance.decimals).toBe(18)
    expect(daiBalance?.balance.formatted).toBe('1')
  })

  it('should filter zero balances when filterZeroBalances is true', async () => {
    const node = new AlchemyTokenBalances('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    node.filterZeroBalances = true
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
    } as any

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: {
          tokenBalances: [
            {
              contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              tokenBalance: '0x0', // Zero balance
            },
            {
              contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              tokenBalance: '0xde0b6b3a7640000', // Non-zero balance
            },
          ],
        },
      }),
    }

    ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)

    // Should only have one token (the non-zero balance)
    expect(node.tokenBalances).toHaveLength(1)
    expect(node.tokenBalances[0].tokenAddress).toBe('0x6B175474E89094C44Da98b954EedeAC495271d0F')
  })

  it('should include zero balances when filterZeroBalances is false', async () => {
    const node = new AlchemyTokenBalances('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    node.filterZeroBalances = false
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
    } as any

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: {
          tokenBalances: [
            {
              contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              tokenBalance: '0x0', // Zero balance
            },
            {
              contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              tokenBalance: '0xde0b6b3a7640000', // Non-zero balance
            },
          ],
        },
      }),
    }

    ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)

    // Should have both tokens including zero balance
    expect(node.tokenBalances).toHaveLength(2)
  })

  it('should handle API errors gracefully', async () => {
    const node = new AlchemyTokenBalances('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
    } as any

    const mockResponse = {
      ok: false,
      status: 400,
    }

    ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

    const mockContext = {} as ExecutionContext

    await expect(node.execute(mockContext)).rejects.toThrow('HTTP error! status: 400')
  })

  it('should sanitize API key from error messages', async () => {
    const node = new AlchemyTokenBalances('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    const testApiKey = 'super-secret-api-key'
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: testApiKey }),
    } as any

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        error: {
          message: `Invalid API key: ${testApiKey}`,
        },
      }),
    }

    ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

    const mockContext = {} as ExecutionContext

    try {
      await node.execute(mockContext)
    } catch (error: any) {
      expect(error.message).toContain('[REDACTED]')
      expect(error.message).not.toContain(testApiKey)
    }
  })
})

// Integration tests - only run if ALCHEMY_API_KEY is set
describe.skipIf(!process.env.ALCHEMY_API_KEY)('alchemyTokenBalances - Integration Tests', () => {
  beforeAll(() => {
    // Restore real fetch for integration tests
    vi.restoreAllMocks()
  })

  it('should fetch real token balances from Alchemy API', async () => {
    const node = new AlchemyTokenBalances('test-integration')
    // Vitalik's address - known to have multiple tokens
    node.walletAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    node.network = 'eth-mainnet'
    node.filterZeroBalances = true

    // Use real API key from environment
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({
        apiKey: process.env.ALCHEMY_API_KEY,
      }),
    } as any

    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)

    // Should have fetched some token balances
    expect(node.tokenBalances).toBeDefined()
    expect(Array.isArray(node.tokenBalances)).toBe(true)

    // Each balance should have required fields
    node.tokenBalances.forEach((balance) => {
      expect(balance.tokenAddress).toBeTruthy()
      expect(balance.balance).toBeDefined()
      expect(balance.balance.value).toBeTruthy()
      expect(balance.chainId).toBe(1) // Mainnet
    })

    console.log(`Found ${node.tokenBalances.length} tokens with non-zero balances`)
  }, 30000) // Longer timeout for real API call
})

/**
 * To run integration tests, set the ALCHEMY_API_KEY environment variable:
 *
 * export ALCHEMY_API_KEY="your-api-key-here"
 * npm test
 *
 * Or run tests with the environment variable inline:
 * ALCHEMY_API_KEY="your-api-key-here" npm test
 */

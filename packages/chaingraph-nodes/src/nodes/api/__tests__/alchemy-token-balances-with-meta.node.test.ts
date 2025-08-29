/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '@badaitech/chaingraph-types'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import AlchemyTokenBalancesWithMeta from '../alchemy-token-balances-with-meta.node'

// Mock fetch globally for unit tests
globalThis.fetch = vi.fn()

describe('alchemyTokenBalancesWithMeta - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create node with default values', () => {
    const node = new AlchemyTokenBalancesWithMeta('test-id')
    expect(node.network).toBe('eth-mainnet')
    expect(node.filterZeroBalances).toBe(true)
    expect(node.walletAddress).toBe('')
    expect(node.contractAddresses).toEqual([])
  })

  it('should fetch token balances with metadata using alchemy_getTokenBalances and alchemy_getTokenMetadata', async () => {
    const node = new AlchemyTokenBalancesWithMeta('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
    } as any

    // Mock balance response
    const balanceResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: {
          tokenBalances: [
            {
              contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              tokenBalance: '0x5f5e100', // 100 USDC
            },
            {
              contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              tokenBalance: '0xde0b6b3a7640000', // 1 DAI
            },
          ],
        },
      }),
    }

    // Mock metadata response (batch request)
    const metadataResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          result: {
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
        },
        {
          id: 2,
          result: {
            decimals: 18,
            symbol: 'DAI',
            name: 'Dai Stablecoin',
          },
        },
      ]),
    }

    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(balanceResponse)
      .mockResolvedValueOnce(metadataResponse)

    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)

    // Verify the correct API methods were called
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    
    // First call should be alchemy_getTokenBalances
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('alchemy_getTokenBalances'),
      }),
    )
    
    // Second call should be batch alchemy_getTokenMetadata
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('alchemy_getTokenMetadata'),
      }),
    )

    // Verify we have the correct number of tokens
    expect(node.tokenBalances).toHaveLength(2)

    // Verify USDC balance with metadata
    const usdcBalance = node.tokenBalances.find(
      t => t.token.address.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    )
    expect(usdcBalance).toBeDefined()
    expect(usdcBalance?.token.symbol).toBe('USDC')
    expect(usdcBalance?.token.name).toBe('USD Coin')
    expect(usdcBalance?.token.decimals).toBe(6)
    expect(usdcBalance?.balance.decimals).toBe(6)
    expect(usdcBalance?.balance.formatted).toBe('100')

    // Verify DAI balance with metadata
    const daiBalance = node.tokenBalances.find(
      t => t.token.address.toLowerCase() === '0x6b175474e89094c44da98b954eedeac495271d0f',
    )
    expect(daiBalance).toBeDefined()
    expect(daiBalance?.token.symbol).toBe('DAI')
    expect(daiBalance?.token.name).toBe('Dai Stablecoin')
    expect(daiBalance?.token.decimals).toBe(18)
    expect(daiBalance?.balance.decimals).toBe(18)
    expect(daiBalance?.balance.formatted).toBe('1')
  })

  it('should not paginate with alchemy_getTokenBalances', async () => {
    const node = new AlchemyTokenBalancesWithMeta('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
    } as any

    // Balance response (no pagination)
    const balanceResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: {
          tokenBalances: [
            {
              contractAddress: '0xToken1',
              tokenBalance: '0x1',
            },
            {
              contractAddress: '0xToken2',
              tokenBalance: '0x2',
            },
          ],
        },
      }),
    }

    // Metadata response
    const metadataResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          result: {
            decimals: 18,
            symbol: 'TOK1',
            name: 'Token 1',
          },
        },
        {
          id: 2,
          result: {
            decimals: 18,
            symbol: 'TOK2',
            name: 'Token 2',
          },
        },
      ]),
    }

    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(balanceResponse)
      .mockResolvedValueOnce(metadataResponse)

    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)

    // Should have called fetch twice (balances and metadata)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)

    // Should have both tokens
    expect(node.tokenBalances).toHaveLength(2)
  })

  it('should filter by contract addresses when provided', async () => {
    const node = new AlchemyTokenBalancesWithMeta('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    node.contractAddresses = ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48']
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
    } as any

    const balanceResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: {
          tokenBalances: [
            {
              contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              tokenBalance: '0x5f5e100',
            },
          ],
        },
      }),
    }

    const metadataResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          result: {
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
        },
      ]),
    }

    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(balanceResponse)
      .mockResolvedValueOnce(metadataResponse)

    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)

    // Verify contractAddresses was included in the balance request
    const callBody = JSON.parse(
      (globalThis.fetch as any).mock.calls[0][1].body,
    )
    expect(callBody.params[1]).toEqual(['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'])
  })

  it('should filter zero balances when filterZeroBalances is true', async () => {
    const node = new AlchemyTokenBalancesWithMeta('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    node.filterZeroBalances = true
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
    } as any

    const balanceResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: {
          tokenBalances: [
            {
              contractAddress: '0xToken1',
              tokenBalance: '0x0', // Zero balance
            },
            {
              contractAddress: '0xToken2',
              tokenBalance: '0x1', // Non-zero balance
            },
          ],
        },
      }),
    }

    // Only metadata for non-zero token should be requested
    const metadataResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          result: {
            decimals: 18,
            symbol: 'ONE',
            name: 'One Token',
          },
        },
      ]),
    }

    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(balanceResponse)
      .mockResolvedValueOnce(metadataResponse)

    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)

    // Should only have one token (the non-zero balance)
    expect(node.tokenBalances).toHaveLength(1)
    expect(node.tokenBalances[0].token.symbol).toBe('ONE')
  })

  it('should include zero balances when filterZeroBalances is false', async () => {
    const node = new AlchemyTokenBalancesWithMeta('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    node.filterZeroBalances = false
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
    } as any

    const balanceResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: {
          tokenBalances: [
            {
              contractAddress: '0xToken1',
              tokenBalance: '0x0', // Zero balance
            },
            {
              contractAddress: '0xToken2',
              tokenBalance: '0x1', // Non-zero balance
            },
          ],
        },
      }),
    }

    const metadataResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          result: {
            decimals: 18,
            symbol: 'ZERO',
            name: 'Zero Token',
          },
        },
        {
          id: 2,
          result: {
            decimals: 18,
            symbol: 'ONE',
            name: 'One Token',
          },
        },
      ]),
    }

    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(balanceResponse)
      .mockResolvedValueOnce(metadataResponse)

    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)

    // Should have both tokens including zero balance
    expect(node.tokenBalances).toHaveLength(2)
  })

  it('should handle missing token metadata gracefully', async () => {
    const node = new AlchemyTokenBalancesWithMeta('test-id')
    node.walletAddress = '0x1234567890123456789012345678901234567890'
    node.apiKey = {
      decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
    } as any

    const balanceResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: {
          tokenBalances: [
            {
              contractAddress: '0xToken1',
              tokenBalance: '0x1',
            },
            {
              contractAddress: '0xToken2',
              tokenBalance: '0x2',
            },
          ],
        },
      }),
    }

    const metadataResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          result: {
            // Missing all metadata
          },
        },
        {
          id: 2,
          result: {
            decimals: null, // Null decimals
            symbol: '', // Empty symbol
            name: undefined, // Undefined name
          },
        },
      ]),
    }

    ;(globalThis.fetch as any)
      .mockResolvedValueOnce(balanceResponse)
      .mockResolvedValueOnce(metadataResponse)

    const mockContext = {} as ExecutionContext
    await node.execute(mockContext)

    // Should handle missing metadata with defaults
    expect(node.tokenBalances).toHaveLength(2)

    const token1 = node.tokenBalances[0]
    expect(token1.token.decimals).toBe(18) // Default decimals
    expect(token1.token.symbol).toBe('')
    expect(token1.token.name).toBe('')

    const token2 = node.tokenBalances[1]
    expect(token2.token.decimals).toBe(18) // Default decimals when null
    expect(token2.token.symbol).toBe('')
    expect(token2.token.name).toBe('')
  })

  it('should handle API errors gracefully', async () => {
    const node = new AlchemyTokenBalancesWithMeta('test-id')
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
    const node = new AlchemyTokenBalancesWithMeta('test-id')
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
describe.skipIf(!process.env.ALCHEMY_API_KEY)('alchemyTokenBalancesWithMeta - Integration Tests', () => {
  beforeAll(() => {
    // Restore real fetch for integration tests
    vi.restoreAllMocks()
  })

  it('should fetch real token balances with metadata from Alchemy API', async () => {
    const node = new AlchemyTokenBalancesWithMeta('test-integration')
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

    // Each balance should have required fields with metadata
    node.tokenBalances.forEach((balance) => {
      // Token metadata
      expect(balance.token).toBeDefined()
      expect(balance.token.address).toBeTruthy()
      expect(balance.token.chainId).toBe(1) // Mainnet

      // Balance info
      expect(balance.balance).toBeDefined()
      expect(balance.balance.value).toBeTruthy()
      expect(balance.balance.decimals).toBeGreaterThanOrEqual(0)

      // Most tokens should have symbols and names (but not required)
      // Just log for inspection
      if (balance.token.symbol) {
        console.log(`Token: ${balance.token.symbol} (${balance.token.name})`)
      }
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
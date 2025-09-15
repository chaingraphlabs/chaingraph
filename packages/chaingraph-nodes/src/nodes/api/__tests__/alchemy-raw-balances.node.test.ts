/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import AlchemyRawBalances from '../alchemy-raw-balances.node'

describe('alchemy raw balances node', () => {
  let node: AlchemyRawBalances
  const mockContext = {
    graphId: 'test-graph',
    nodeId: 'test-node',
  }

  beforeEach(() => {
    node = new AlchemyRawBalances(mockContext as any)
    vi.clearAllMocks()
  })

  describe('unit tests', () => {
    beforeAll(() => {
      globalThis.fetch = vi.fn()
    })

    it('should create node with default values', () => {
      expect(node.network).toBe('eth-mainnet')
      expect(node.walletAddress).toBe('')
      expect(node.contractAddresses).toEqual([])
      expect(node.rawBalances).toEqual([])
    })

    it('should make single API call to alchemy_getTokenBalances', async () => {
      const mockApiKey = { decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-key' }) }
      node.apiKey = mockApiKey as any
      node.walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          result: {
            tokenBalances: [
              { contractAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82', tokenBalance: '0x1234' },
              { contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', tokenBalance: '0x5678' },
            ],
          },
        }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await node.execute(mockContext as any)

      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = (globalThis.fetch as any).mock.calls[0]
      expect(url).toContain('https://eth-mainnet.g.alchemy.com')

      const body = JSON.parse(options.body)
      expect(body.method).toBe('alchemy_getTokenBalances')
      expect(body.params).toEqual(['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'])

      // Should NOT call alchemy_getTokenMetadata
      expect(options.body).not.toContain('alchemy_getTokenMetadata')
    })

    it('should return stringified BigInt balances instead of hex', async () => {
      const mockApiKey = { decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-key' }) }
      node.apiKey = mockApiKey as any
      node.walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          result: {
            tokenBalances: [
              { contractAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82', tokenBalance: '0xde0b6b3a7640000' },
              { contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', tokenBalance: '0x0' },
            ],
          },
        }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await node.execute(mockContext as any)

      expect(node.rawBalances).toHaveLength(2)
      expect(node.rawBalances[0].tokenAddress).toBe('0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82')
      expect(node.rawBalances[0].balance).toBe('1000000000000000000') // Converted from hex to string
      expect(node.rawBalances[0].chainId).toBe(1)

      expect(node.rawBalances[1].tokenAddress).toBe('0x6B175474E89094C44Da98b954EedeAC495271d0F')
      expect(node.rawBalances[1].balance).toBe('0')
      expect(node.rawBalances[1].chainId).toBe(1)
    })

    it('should include zero balances without filtering', async () => {
      const mockApiKey = { decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-key' }) }
      node.apiKey = mockApiKey as any
      node.walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          result: {
            tokenBalances: [
              { contractAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82', tokenBalance: '0x1234' },
              { contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', tokenBalance: '0x0' },
              { contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', tokenBalance: null },
            ],
          },
        }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await node.execute(mockContext as any)

      expect(node.rawBalances).toHaveLength(3)
      expect(node.rawBalances[1].balance).toBe('0')
      expect(node.rawBalances[2].balance).toBe('0') // null becomes '0'
    })

    it('should handle specific contract addresses', async () => {
      const mockApiKey = { decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-key' }) }
      node.apiKey = mockApiKey as any
      node.walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      node.contractAddresses = ['0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82']

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          result: {
            tokenBalances: [
              { contractAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82', tokenBalance: '0x1234' },
            ],
          },
        }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await node.execute(mockContext as any)

      const [url, options] = (globalThis.fetch as any).mock.calls[0]
      const body = JSON.parse(options.body)
      expect(body.params).toEqual([
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        ['0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82'],
      ])
    })

    it('should handle API errors gracefully', async () => {
      const mockApiKey = { decrypt: vi.fn().mockResolvedValue({ apiKey: 'test-key' }) }
      node.apiKey = mockApiKey as any
      node.walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Invalid request' },
        }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await expect(node.execute(mockContext as any)).rejects.toThrow('Alchemy API error: Invalid request')
    })

    it('should sanitize API key from error messages', async () => {
      const mockApiKey = { decrypt: vi.fn().mockResolvedValue({ apiKey: 'secret-api-key' }) }
      node.apiKey = mockApiKey as any
      node.walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

      ;(globalThis.fetch as any).mockRejectedValue(new Error('Network error with secret-api-key'))

      await expect(node.execute(mockContext as any)).rejects.toThrow('Failed to fetch raw balances: Network error with [REDACTED]')
    })
  })

  describe.skipIf(!process.env.ALCHEMY_API_KEY)('integration tests', () => {
    it('should fetch real token balances', async () => {
      const mockApiKey = {
        decrypt: vi.fn().mockResolvedValue({ apiKey: process.env.ALCHEMY_API_KEY }),
      }
      node.apiKey = mockApiKey as any
      // Vitalik's address for testing
      node.walletAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      node.network = 'eth-mainnet'

      await node.execute(mockContext as any)

      expect(node.rawBalances).toBeDefined()
      expect(Array.isArray(node.rawBalances)).toBe(true)
      if (node.rawBalances.length > 0) {
        expect(node.rawBalances[0].tokenAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
        expect(node.rawBalances[0].balance).toMatch(/^\d+$/) // Should be a decimal string
        expect(node.rawBalances[0].chainId).toBe(1)
      }
    })
  })
})

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import TokenBalanceFormatter from '../token-balance-formatter.node'

describe('token balance formatter node', () => {
  let node: TokenBalanceFormatter
  const mockContext = {
    graphId: 'test-graph',
    nodeId: 'test-node',
  }

  beforeEach(() => {
    node = new TokenBalanceFormatter()
  })

  describe('unit tests', () => {
    it('should create node with default values', () => {
      expect(node.rawBalances).toEqual([])
      expect(node.tokenConfigs).toEqual([])
      expect(node.defaultDecimals).toBe(18)
      expect(node.filterZeroBalances).toBe(true)
      expect(node.formattedBalances).toEqual([])
    })

    it('should convert hex to decimal and format balances', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82',
          balanceHex: '0xde0b6b3a7640000', // 1e18 in hex
          chainId: 1,
        },
        {
          tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          balanceHex: '0x1bc16d674ec80000', // 2e18 in hex
          chainId: 1,
        },
      ]
      node.filterZeroBalances = false

      await node.execute(mockContext as any)

      expect(node.formattedBalances).toHaveLength(2)
      expect(node.formattedBalances[0].rawValue).toBe('1000000000000000000')
      expect(node.formattedBalances[0].formattedValue).toBe('1.0')
      expect(node.formattedBalances[0].decimals).toBe(18)

      expect(node.formattedBalances[1].rawValue).toBe('2000000000000000000')
      expect(node.formattedBalances[1].formattedValue).toBe('2.0')
      expect(node.formattedBalances[1].decimals).toBe(18)
    })

    it('should use token-specific decimals from config', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82',
          balanceHex: '0xf4240', // 1000000 in hex (1 USDC with 6 decimals)
          chainId: 1,
        },
        {
          tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          balanceHex: '0xde0b6b3a7640000', // 1e18 in hex (1 DAI with 18 decimals)
          chainId: 1,
        },
      ]

      node.tokenConfigs = [
        {
          address: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82',
          decimals: 6,
          symbol: 'USDC',
          name: 'USD Coin',
        },
        {
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          decimals: 18,
          symbol: 'DAI',
          name: 'Dai Stablecoin',
        },
      ]

      node.filterZeroBalances = false

      await node.execute(mockContext as any)

      expect(node.formattedBalances).toHaveLength(2)

      // USDC with 6 decimals
      expect(node.formattedBalances[0].rawValue).toBe('1000000')
      expect(node.formattedBalances[0].formattedValue).toBe('1.0')
      expect(node.formattedBalances[0].decimals).toBe(6)
      expect(node.formattedBalances[0].symbol).toBe('USDC')
      expect(node.formattedBalances[0].name).toBe('USD Coin')

      // DAI with 18 decimals
      expect(node.formattedBalances[1].rawValue).toBe('1000000000000000000')
      expect(node.formattedBalances[1].formattedValue).toBe('1.0')
      expect(node.formattedBalances[1].decimals).toBe(18)
      expect(node.formattedBalances[1].symbol).toBe('DAI')
      expect(node.formattedBalances[1].name).toBe('Dai Stablecoin')
    })

    it('should filter zero balances when enabled', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82',
          balanceHex: '0xde0b6b3a7640000',
          chainId: 1,
        },
        {
          tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          balanceHex: '0x0',
          chainId: 1,
        },
        {
          tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          balanceHex: '0x',
          chainId: 1,
        },
      ]

      node.filterZeroBalances = true

      await node.execute(mockContext as any)

      expect(node.formattedBalances).toHaveLength(1)
      expect(node.formattedBalances[0].tokenAddress).toBe('0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82')
    })

    it('should not filter zero balances when disabled', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82',
          balanceHex: '0xde0b6b3a7640000',
          chainId: 1,
        },
        {
          tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          balanceHex: '0x0',
          chainId: 1,
        },
      ]

      node.filterZeroBalances = false

      await node.execute(mockContext as any)

      expect(node.formattedBalances).toHaveLength(2)
      expect(node.formattedBalances[1].formattedValue).toBe('0.0')
    })

    it('should handle fractional amounts correctly', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82',
          balanceHex: '0x16345785d8a0000', // 0.1e18 in hex
          chainId: 1,
        },
        {
          tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          balanceHex: '0x8ac7230489e80000', // 10e18 in hex
          chainId: 1,
        },
      ]

      node.filterZeroBalances = false

      await node.execute(mockContext as any)

      expect(node.formattedBalances[0].formattedValue).toBe('0.1')
      expect(node.formattedBalances[1].formattedValue).toBe('10.0')
    })

    it('should handle case-insensitive token address matching', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xA0B86991C084E71824DC9A28A19D0CBA1638EC82', // Upper case
          balanceHex: '0xf4240',
          chainId: 1,
        },
      ]

      node.tokenConfigs = [
        {
          address: '0xa0b86991c084e71824dc9a28a19d0cba1638ec82', // Lower case
          decimals: 6,
          symbol: 'USDC',
        },
      ]

      node.filterZeroBalances = false

      await node.execute(mockContext as any)

      expect(node.formattedBalances[0].decimals).toBe(6)
      expect(node.formattedBalances[0].symbol).toBe('USDC')
    })

    it('should use default decimals for unknown tokens', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xUnknownToken',
          balanceHex: '0xde0b6b3a7640000',
          chainId: 1,
        },
      ]

      node.tokenConfigs = [
        {
          address: '0xKnownToken',
          decimals: 6,
          symbol: 'KNOWN',
        },
      ]

      node.defaultDecimals = 18
      node.filterZeroBalances = false

      await node.execute(mockContext as any)

      expect(node.formattedBalances[0].decimals).toBe(18)
      expect(node.formattedBalances[0].symbol).toBeUndefined()
    })

    it('should handle empty input gracefully', async () => {
      node.rawBalances = []

      await node.execute(mockContext as any)

      expect(node.formattedBalances).toEqual([])
    })

    it('should handle invalid hex values gracefully', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xToken1',
          balanceHex: 'invalid-hex',
          chainId: 1,
        },
        {
          tokenAddress: '0xToken2',
          balanceHex: '0xde0b6b3a7640000',
          chainId: 1,
        },
      ]

      node.filterZeroBalances = false

      await node.execute(mockContext as any)

      expect(node.formattedBalances).toHaveLength(2)
      expect(node.formattedBalances[0].rawValue).toBe('0')
      expect(node.formattedBalances[0].formattedValue).toBe('0.0')
      expect(node.formattedBalances[1].rawValue).toBe('1000000000000000000')
    })
  })
})

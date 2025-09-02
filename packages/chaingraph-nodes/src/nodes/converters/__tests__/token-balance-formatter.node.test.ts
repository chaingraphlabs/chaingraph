/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { Token } from '../../blockchain/schemas'
import TokenBalanceFormatter from '../token-balance-formatter.node'

describe('token balance formatter node', () => {
  let node: TokenBalanceFormatter
  const mockContext = {
    graphId: 'test-graph',
    nodeId: 'test-node',
  }

  beforeEach(() => {
    node = new TokenBalanceFormatter(mockContext as any)
  })

  describe('unit tests', () => {
    it('should create node with default values', () => {
      expect(node.rawBalances).toEqual([])
      expect(node.tokens).toEqual([])
      expect(node.tokenBalances).toEqual([])
    })

    it('should format balances for tokens in configuration', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82',
          balance: '1000000', // 1 USDC with 6 decimals
          chainId: 1,
        },
        {
          tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          balance: '1000000000000000000', // 1 DAI with 18 decimals
          chainId: 1,
        },
      ]

      const usdcToken = new Token()
      usdcToken.address = '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82'
      usdcToken.decimals = 6
      usdcToken.symbol = 'USDC'
      usdcToken.name = 'USD Coin'
      usdcToken.chainId = 1

      const daiToken = new Token()
      daiToken.address = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      daiToken.decimals = 18
      daiToken.symbol = 'DAI'
      daiToken.name = 'Dai Stablecoin'
      daiToken.chainId = 1

      node.tokens = [usdcToken, daiToken]

      await node.execute(mockContext as any)

      expect(node.tokenBalances).toHaveLength(2)

      // USDC with 6 decimals
      expect(node.tokenBalances[0].amount.value).toBe('1000000')
      expect(node.tokenBalances[0].amount.formatted).toBe('1.0')
      expect(node.tokenBalances[0].amount.decimals).toBe(6)
      expect(node.tokenBalances[0].token.symbol).toBe('USDC')
      expect(node.tokenBalances[0].token.name).toBe('USD Coin')

      // DAI with 18 decimals
      expect(node.tokenBalances[1].amount.value).toBe('1000000000000000000')
      expect(node.tokenBalances[1].amount.formatted).toBe('1.0')
      expect(node.tokenBalances[1].amount.decimals).toBe(18)
      expect(node.tokenBalances[1].token.symbol).toBe('DAI')
      expect(node.tokenBalances[1].token.name).toBe('Dai Stablecoin')
    })

    it('should skip tokens not in configuration', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82',
          balance: '1000000',
          chainId: 1,
        },
        {
          tokenAddress: '0xUnknownToken',
          balance: '9999999999',
          chainId: 1,
        },
      ]

      const usdcToken = new Token()
      usdcToken.address = '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82'
      usdcToken.decimals = 6
      usdcToken.symbol = 'USDC'
      usdcToken.chainId = 1

      node.tokens = [usdcToken]

      await node.execute(mockContext as any)

      expect(node.tokenBalances).toHaveLength(1)
      expect(node.tokenBalances[0].token.address).toBe('0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82')
    })

    it('should filter zero balances automatically', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82',
          balance: '1000000',
          chainId: 1,
        },
        {
          tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          balance: '0',
          chainId: 1,
        },
      ]

      const usdcToken = new Token()
      usdcToken.address = '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82'
      usdcToken.decimals = 6
      usdcToken.symbol = 'USDC'
      usdcToken.chainId = 1

      const daiToken = new Token()
      daiToken.address = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      daiToken.decimals = 18
      daiToken.symbol = 'DAI'
      daiToken.chainId = 1

      node.tokens = [usdcToken, daiToken]

      await node.execute(mockContext as any)

      expect(node.tokenBalances).toHaveLength(1)
      expect(node.tokenBalances[0].token.symbol).toBe('USDC')
    })

    it('should handle case-insensitive token address matching', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xA0B86991C084E71824DC9A28A19D0CBA1638EC82', // Upper case
          balance: '1000000',
          chainId: 1,
        },
      ]

      const token = new Token()
      token.address = '0xa0b86991c084e71824dc9a28a19d0cba1638ec82' // Lower case
      token.decimals = 6
      token.symbol = 'USDC'
      token.chainId = 1

      node.tokens = [token]

      await node.execute(mockContext as any)

      expect(node.tokenBalances).toHaveLength(1)
      expect(node.tokenBalances[0].token.decimals).toBe(6)
      expect(node.tokenBalances[0].token.symbol).toBe('USDC')
    })

    it('should handle empty input gracefully', async () => {
      node.rawBalances = []
      node.tokens = []

      await node.execute(mockContext as any)

      expect(node.tokenBalances).toEqual([])
    })

    it('should handle fractional amounts correctly', async () => {
      node.rawBalances = [
        {
          tokenAddress: '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82',
          balance: '100000000000000000', // 0.1e18
          chainId: 1,
        },
        {
          tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          balance: '10000000000000000000', // 10e18
          chainId: 1,
        },
      ]

      const token1 = new Token()
      token1.address = '0xA0b86991c084e71824Dc9a28A19D0cba1638Ec82'
      token1.decimals = 18
      token1.chainId = 1

      const token2 = new Token()
      token2.address = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      token2.decimals = 18
      token2.chainId = 1

      node.tokens = [token1, token2]

      await node.execute(mockContext as any)

      expect(node.tokenBalances[0].amount.formatted).toBe('0.1')
      expect(node.tokenBalances[1].amount.formatted).toBe('10.0')
    })
  })
})

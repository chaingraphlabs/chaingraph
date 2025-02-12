/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  NodeExecutionStatus,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'CoinMarketCap Price Fetcher',
  description: 'Fetches cryptocurrency prices from CoinMarketCap',
  category: NODE_CATEGORIES.API,
  tags: ['crypto', 'finance', 'cmc'],
})
class CoinMarketCapNode extends BaseNode {
  @Input()
  @String({
    title: 'Cryptocurrencies',
    description: 'Comma-separated list of cryptocurrency names, tickers, or contract addresses',
  })
  cryptoList: string = ''

  @Input()
  @String({
    title: 'Blockchain (optional)',
    description: 'Comma-separated list of blockchains to filter by',
  })
  blockchain: string = ''

  @Input()
  @String({
    title: 'Date (optional)',
    description: 'Historical date in YYYY-MM-DD format',
  })
  date: string = ''

  @Input()
  @String({
    title: 'API Key',
    description: 'CoinMarketCap API Key',
    ui: { isPassword: true },
  })
  apiKey: string = ''

  @Output()
  @String({
    title: 'Result',
    description: 'Fetched cryptocurrency data',
  })
  result: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.apiKey) {
      throw new Error('API Key is required')
    }

    const cryptos = this.cryptoList.split(',').map((c) => c.trim())
    const blockchains = this.blockchain ? this.blockchain.split(',').map((b) => b.trim()) : []
    
    // Mock API request - replace with actual API call
    const data = cryptos.map((crypto) => ({
      name: crypto,
      ticker: crypto.toUpperCase(),
      description: `Sample data for ${crypto}`,
      website: `https://coinmarketcap.com/currencies/${crypto.toLowerCase()}`,
      contractAddresses: blockchains.map((chain) => ({ blockchain: chain, address: '0x123...' })),
      financials: {
        ath: Math.random() * 100000,
        price: Math.random() * 1000,
        volume_24h: Math.random() * 1000000,
        change_24h: Math.random() * 20 - 10,
        market_cap: Math.random() * 1000000000,
        total_supply: Math.random() * 10000000,
        circulating_supply: Math.random() * 5000000,
      },
    }))

    this.result = JSON.stringify(data, null, 2)

    console.log('result', this.result)

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    }
  }
}

export default CoinMarketCapNode

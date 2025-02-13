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
  ObjectSchema,
  Number,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@ObjectSchema({
  description: 'Structured data for cryptocurrency information',
})
class CryptoData {
  @String({ title: 'Name', description: 'Cryptocurrency name' })
  name: string = ''

  @String({ title: 'Ticker', description: 'Cryptocurrency ticker symbol' })
  ticker: string = ''

  @String({ title: 'Description', description: 'Brief description of the cryptocurrency' })
  description: string = ''

  @String({ title: 'Website', description: 'Official website URL' })
  website: string = ''

  @Number({ title: 'ATH', description: 'All-time high price' })
  ath: number = 0

  @Number({ title: 'Price', description: 'Current price' })
  price: number = 0

  @Number({ title: '24h Volume', description: 'Trading volume in the last 24 hours' })
  volume_24h: number = 0

  @Number({ title: '24h Change', description: 'Price change in the last 24 hours' })
  change_24h: number = 0

  @Number({ title: 'Market Cap', description: 'Total market capitalization' })
  market_cap: number = 0

  @Number({ title: 'Total Supply', description: 'Total available supply of the cryptocurrency' })
  total_supply: number = 0

  @Number({ title: 'Circulating Supply', description: 'Currently circulating supply' })
  circulating_supply: number = 0
}

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
  result: CryptoData[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.apiKey) {
      throw new Error('API Key is required')
    }

    const cryptos = this.cryptoList.split(',').map((c) => c.trim())
    
    // Mock API request - replace with actual API call
    this.result = cryptos.map((crypto) => ({
      name: crypto,
      ticker: crypto.toUpperCase(),
      description: `Sample data for ${crypto}`,
      website: `https://coinmarketcap.com/currencies/${crypto.toLowerCase()}`,
      ath: Math.random() * 100000,
      price: Math.random() * 1000,
      volume_24h: Math.random() * 1000000,
      change_24h: Math.random() * 20 - 10,
      market_cap: Math.random() * 1000000000,
      total_supply: Math.random() * 10000000,
      circulating_supply: Math.random() * 5000000,
    }))

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
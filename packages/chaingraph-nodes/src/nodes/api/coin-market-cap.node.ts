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
  PortObject,
  PortArray,
  StringEnum,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest'

@ObjectSchema({
  description: 'Financial information for a cryptocurrency',
})
class Financials {
  @Number({ title: 'ATH', description: 'All-time high price' })
  ath: number = 0;

  @Number({ title: 'Price', description: 'Current price' })
  price: number = 0;

  @Number({ title: '24h Volume', description: 'Trading volume in the last 24 hours' })
  volume_24h: number = 0;

  @Number({ title: '24h Change', description: 'Price change in the last 24 hours' })
  change_24h: number = 0;

  @Number({ title: 'Market Cap', description: 'Total market capitalization' })
  market_cap: number = 0;

  @Number({ title: 'Total Supply', description: 'Total available supply of the cryptocurrency' })
  total_supply: number = 0;

  @Number({ title: 'Circulating Supply', description: 'Currently circulating supply' })
  circulating_supply: number = 0;
}
@ObjectSchema({
  description: 'Asset contract addresses, containing blockchain and address pairs',
})
class ContractAddress {
  @String({ title: 'Blockchain', description: 'Blockchain name' })
  blockchain: string = ''

  @String({ title: 'Address', description: 'Contract address' })
  address: string = ''
}
@ObjectSchema({
  description: 'Structured data for cryptocurrency information',
})
class CryptoData {
  @String({ title: 'Name', description: 'Cryptocurrency name' })
  name: string = '';

  @String({ title: 'Ticker', description: 'Cryptocurrency ticker symbol' })
  ticker: string = '';

  @String({ title: 'Description', description: 'Brief description of the cryptocurrency' })
  description: string = '';

  @String({ title: 'Website', description: 'Official website URL' })
  website: string = '';

  @PortArray({
    title: 'Contract Addresses',
    description: 'List of blockchain-address pairs',
    itemConfig: { type: 'object', schema: ContractAddress },
  })
  contractAddresses: ContractAddress[] = [];

  @PortObject({ schema: Financials })
  financials: Financials = new Financials();
}

@Node({
  title: 'CoinMarketCap Price Fetcher',
  description: 'Fetches cryptocurrency prices from CoinMarketCap',
  category: NODE_CATEGORIES.API,
  tags: ['crypto', 'finance', 'cmc'],
})
class CoinMarketCapNode extends BaseNode {
  @Input()
  @PortArray({
    title: 'Cryptocurrencies',
    description: 'List of cryptocurrency names, tickers, or contract addresses',
    itemConfig: { type: 'string' },
  })
  cryptoList: string[] = [];

  @Input()
  @StringEnum(['none', 'bsc'], {
    title: 'Blockchain',
    description: 'Filter results by blockchain',
    defaultValue: 'none',
    options: [
      { id: 'none', type: 'string', defaultValue: 'none', title: 'No filter' },
      { id: 'bsc', type: 'string', defaultValue: 'bsc', title: 'BSC' },
    ],
  })
  blockchain: string = 'none';

  @Input()
  @String({
    title: 'Date (optional)',
    description: 'Historical date in YYYY-MM-DD format',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  date: string = '';

  @Input()
  @String({
    title: 'API Key',
    description: 'CoinMarketCap API Key',
    ui: { isPassword: true },
  })
  apiKey: string = '';

  @Output()
  @PortArray({
    title: 'Result',
    description: 'List of cryptocurrency data objects',
    itemConfig: { type: 'object', schema: CryptoData },
  })
  result: CryptoData[] = [];

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.apiKey) {
      throw new Error('API Key is required');
    }

    const cryptos = this.cryptoList.join(',');
    const url = `${CMC_API_URL}?symbol=${cryptos}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': this.apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data from CoinMarketCap: ${response.statusText}`);
    }

    const data = await response.json();
    const results: CryptoData[] = [];

    for (const symbol of Object.keys(data.data)) {
      const crypto = data.data[symbol];
      const contractAddresses: ContractAddress[] = crypto.platform
        ? Object.entries(crypto.platform).map(([blockchain, address]) => ({
            blockchain,
            address: address as string,
          }))
        : [];

      const cryptoData: CryptoData = {
        name: crypto.name,
        ticker: crypto.symbol,
        description: crypto.description || 'No description available',
        website: crypto.urls?.website?.[0] || '',
        contractAddresses: contractAddresses,
        financials: {
          ath: crypto.quote?.USD?.ath ?? 0,
          price: crypto.quote?.USD?.price ?? 0,
          volume_24h: crypto.quote?.USD?.volume_24h ?? 0,
          change_24h: crypto.quote?.USD?.percent_change_24h ?? 0,
          market_cap: crypto.quote?.USD?.market_cap ?? 0,
          total_supply: crypto.total_supply ?? 0,
          circulating_supply: crypto.circulating_supply ?? 0,
        },
      };

      results.push(cryptoData);
    }

    this.result = results;
    console.log('res', this.result);
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    };
  }
}

export default CoinMarketCapNode;

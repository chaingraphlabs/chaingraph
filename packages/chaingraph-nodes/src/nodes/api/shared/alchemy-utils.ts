/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '@badaitech/chaingraph-types'
import { Network } from 'alchemy-sdk'

export class Networks {
  static get networkIds() {
    return Object.values(Network)
  }

  static get defaultNetwork() {
    return Network.ETH_MAINNET
  }

  static getOptions() {
    return Object.entries(Network).map(([key, value]) => ({
      id: value,
      title: key.replace(/_/g, ' '),
      type: 'string',
      defaultValue: value,
    })) as IPortConfig[]
  }

  static getAlchemyUrl(network: string, apiKey: string): string {
    return `https://${network}.g.alchemy.com/v2/${apiKey}`
  }
}

export function getChainId(network: string): number {
  const networkToChainId: Record<string, number> = {
    [Network.ETH_MAINNET]: 1,
    [Network.ETH_SEPOLIA]: 11155111,
    [Network.ETH_HOLESKY]: 17000,
    [Network.ETH_HOODI]: 560048,
    [Network.OPT_MAINNET]: 10,
    [Network.OPT_SEPOLIA]: 11155420,
    [Network.ARB_MAINNET]: 42161,
    [Network.ARB_SEPOLIA]: 421614,
    [Network.MATIC_MAINNET]: 137,
    [Network.MATIC_AMOY]: 80002,
    [Network.ASTAR_MAINNET]: 592,
    [Network.POLYGONZKEVM_MAINNET]: 1101,
    [Network.POLYGONZKEVM_CARDONA]: 2442,
    [Network.BASE_MAINNET]: 8453,
    [Network.BASE_SEPOLIA]: 84532,
    [Network.ZKSYNC_MAINNET]: 324,
    [Network.ZKSYNC_SEPOLIA]: 300,
    [Network.SHAPE_MAINNET]: 360,
    [Network.SHAPE_SEPOLIA]: 11011,
    [Network.LINEA_MAINNET]: 59144,
    [Network.LINEA_SEPOLIA]: 59141,
    [Network.FANTOM_MAINNET]: 250,
    [Network.FANTOM_TESTNET]: 4002,
    [Network.ZETACHAIN_MAINNET]: 7000,
    [Network.ZETACHAIN_TESTNET]: 7001,
    [Network.ARBNOVA_MAINNET]: 42170,
    [Network.BLAST_MAINNET]: 81457,
    [Network.BLAST_SEPOLIA]: 168587773,
    [Network.MANTLE_MAINNET]: 5000,
    [Network.MANTLE_SEPOLIA]: 5003,
    [Network.SCROLL_MAINNET]: 534352,
    [Network.SCROLL_SEPOLIA]: 534351,
    [Network.GNOSIS_MAINNET]: 100,
    [Network.GNOSIS_CHIADO]: 10200,
    [Network.BNB_MAINNET]: 56,
    [Network.BNB_TESTNET]: 97,
    [Network.AVAX_MAINNET]: 43114,
    [Network.AVAX_FUJI]: 43113,
    [Network.CELO_MAINNET]: 42220,
    [Network.CELO_ALFAJORES]: 44787,
    [Network.CELO_BAKLAVA]: 62320,
    [Network.METIS_MAINNET]: 1088,
    [Network.OPBNB_MAINNET]: 204,
    [Network.OPBNB_TESTNET]: 5611,
    [Network.BERACHAIN_MAINNET]: 80084,
    [Network.BERACHAIN_BEPOLIA]: 80069,
    [Network.SONEIUM_MAINNET]: 1868,
    [Network.SONEIUM_MINATO]: 1946,
    [Network.WORLDCHAIN_MAINNET]: 480,
    [Network.WORLDCHAIN_SEPOLIA]: 4801,
    [Network.ROOTSTOCK_MAINNET]: 30,
    [Network.ROOTSTOCK_TESTNET]: 31,
    [Network.FLOW_MAINNET]: 747,
    [Network.FLOW_TESTNET]: 545,
    [Network.ZORA_MAINNET]: 7777777,
    [Network.ZORA_SEPOLIA]: 999999999,
    [Network.FRAX_MAINNET]: 252,
    [Network.FRAX_SEPOLIA]: 2522,
    [Network.POLYNOMIAL_MAINNET]: 8008,
    [Network.POLYNOMIAL_SEPOLIA]: 80008,
    [Network.CROSSFI_MAINNET]: 4157,
    [Network.CROSSFI_TESTNET]: 4158,
    [Network.APECHAIN_MAINNET]: 33139,
    [Network.APECHAIN_CURTIS]: 33111,
    [Network.GEIST_MAINNET]: 63157,
    [Network.GEIST_POLTER]: 63158,
    [Network.LUMIA_PRISM]: 994873017,
    [Network.LUMIA_TESTNET]: 1952959480,
    [Network.SONIC_MAINNET]: 146,
    [Network.SONIC_BLAZE]: 57054,
    [Network.XMTP_TESTNET]: 3133,
    [Network.ABSTRACT_MAINNET]: 2741,
    [Network.ABSTRACT_TESTNET]: 11124,
    [Network.DEGEN_MAINNET]: 666666666,
    [Network.INK_MAINNET]: 57073,
    [Network.INK_SEPOLIA]: 763373,
    [Network.SEI_MAINNET]: 1329,
    [Network.SEI_TESTNET]: 713715,
    [Network.RONIN_MAINNET]: 2020,
    [Network.RONIN_SAIGON]: 2021,
    [Network.MONAD_TESTNET]: 41454,
    [Network.SOLANA_MAINNET]: 101,
    [Network.SOLANA_DEVNET]: 103,
    [Network.GENSYN_TESTNET]: 42069,
    [Network.SUPERSEED_MAINNET]: 5330,
    [Network.SUPERSEED_SEPOLIA]: 53302,
    [Network.TEA_SEPOLIA]: 1337702,
    [Network.STORY_MAINNET]: 1513,
    [Network.STORY_AENEID]: 1514,
    [Network.MEGAETH_TESTNET]: 70001,
  }

  return networkToChainId[network] || 1
}

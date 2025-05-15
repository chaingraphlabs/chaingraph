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
  Output,
  PortEnum,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

/**
 * Common blockchain networks supported by OKX DEX
 */
export enum OKXChainNetworks {
  ETHEREUM = 'Ethereum',
  OPTIMISM = 'Optimism',
  BSC = 'BSC',
  OKT_CHAIN = 'OKT Chain',
  SONIC = 'Sonic',
  X_LAYER = 'X Layer',
  POLYGON = 'Polygon',
  ARBITRUM = 'Arbitrum',
  AVALANCHE = 'Avalanche',
  ZKSYNC_ERA = 'zkSync Era',
  POLYGON_ZKEVM = 'Polygon zkEVM',
  BASE = 'Base',
  LINEA = 'Linea',
  FANTOM = 'Fantom Opera',
  MANTLE = 'Mantle',
  CONFLUX = 'Conflux eSpace',
  METIS = 'Metis Andromeda',
  MERLIN = 'Merlin Chain',
  BLAST = 'Blast',
  MANTA = 'Manta Pacific',
  SCROLL = 'Scroll',
  CRONOS = 'Cronos',
  ZETA = 'ZetaChain',
  TRON = 'Tron',
  SOLANA = 'Solana',
  SUI = 'Sui',
  TON = 'Ton',
}

/**
 * Mapping of network names to chain indexes and chain IDs
 */
const CHAIN_MAPPINGS: Record<OKXChainNetworks, { chainIndex: string, chainId: string }> = {
  [OKXChainNetworks.ETHEREUM]: { chainIndex: '1', chainId: '1' },
  [OKXChainNetworks.OPTIMISM]: { chainIndex: '10', chainId: '10' },
  [OKXChainNetworks.BSC]: { chainIndex: '56', chainId: '56' },
  [OKXChainNetworks.OKT_CHAIN]: { chainIndex: '66', chainId: '66' },
  [OKXChainNetworks.SONIC]: { chainIndex: '146', chainId: '146' },
  [OKXChainNetworks.X_LAYER]: { chainIndex: '196', chainId: '196' },
  [OKXChainNetworks.POLYGON]: { chainIndex: '137', chainId: '137' },
  [OKXChainNetworks.ARBITRUM]: { chainIndex: '42161', chainId: '42161' },
  [OKXChainNetworks.AVALANCHE]: { chainIndex: '43114', chainId: '43114' },
  [OKXChainNetworks.ZKSYNC_ERA]: { chainIndex: '324', chainId: '324' },
  [OKXChainNetworks.POLYGON_ZKEVM]: { chainIndex: '1101', chainId: '1101' },
  [OKXChainNetworks.BASE]: { chainIndex: '8453', chainId: '8453' },
  [OKXChainNetworks.LINEA]: { chainIndex: '59144', chainId: '59144' },
  [OKXChainNetworks.FANTOM]: { chainIndex: '250', chainId: '250' },
  [OKXChainNetworks.MANTLE]: { chainIndex: '5000', chainId: '5000' },
  [OKXChainNetworks.CONFLUX]: { chainIndex: '1030', chainId: '1030' },
  [OKXChainNetworks.METIS]: { chainIndex: '1088', chainId: '1088' },
  [OKXChainNetworks.MERLIN]: { chainIndex: '4200', chainId: '4200' },
  [OKXChainNetworks.BLAST]: { chainIndex: '81457', chainId: '81457' },
  [OKXChainNetworks.MANTA]: { chainIndex: '169', chainId: '169' },
  [OKXChainNetworks.SCROLL]: { chainIndex: '534352', chainId: '534352' },
  [OKXChainNetworks.CRONOS]: { chainIndex: '25', chainId: '25' },
  [OKXChainNetworks.ZETA]: { chainIndex: '7000', chainId: '7000' },
  [OKXChainNetworks.TRON]: { chainIndex: '195', chainId: '195' },
  [OKXChainNetworks.SOLANA]: { chainIndex: '501', chainId: '501' },
  [OKXChainNetworks.SUI]: { chainIndex: '784', chainId: '784' },
  [OKXChainNetworks.TON]: { chainIndex: '607', chainId: '607' },
}

/**
 * Node for selecting a blockchain network for OKX DEX API
 *
 * This node provides an easy way to select a supported blockchain network
 * and get the correct chain ID and chain index parameters.
 */
@Node({
  type: 'OKXChainSelectorNode',
  title: 'OKX DEX: Chain Selector',
  description: 'Selects a blockchain network for OKX DEX API operations',
  category: NODE_CATEGORIES.OKX_DEX,
  tags: ['okx', 'dex', 'blockchain', 'network', 'chain'],
})
class OKXChainSelectorNode extends BaseNode {
  @Input()
  @PortEnum({
    title: 'Blockchain Network',
    description: 'Select the blockchain network to use',
    options: Object.values(OKXChainNetworks).map(network => ({
      id: network,
      type: 'string',
      defaultValue: network,
      title: network,
    })),
    defaultValue: OKXChainNetworks.ETHEREUM,
  })
  network: OKXChainNetworks = OKXChainNetworks.ETHEREUM

  @Input()
  @String({
    title: 'Custom Chain ID',
    description: 'Optional custom chain ID (overrides selected network)',
    required: false,
  })
  customChainId?: string

  @Input()
  @String({
    title: 'Custom Chain Index',
    description: 'Optional custom chain index (overrides selected network)',
    required: false,
  })
  customChainIndex?: string

  @Output()
  @String({
    title: 'Chain ID',
    description: 'Blockchain network identifier',
  })
  chainId: string = '1'

  @Output()
  @String({
    title: 'Chain Index',
    description: 'Unique index identifier for the chain',
  })
  chainIndex: string = '1'

  @Output()
  @String({
    title: 'Network Name',
    description: 'Human-readable name of the selected network',
  })
  networkName: string = OKXChainNetworks.ETHEREUM

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Get chain mapping for the selected network
    const mapping = CHAIN_MAPPINGS[this.network]

    // Set output values, prioritizing custom values if provided
    this.chainId = this.customChainId || mapping.chainId
    this.chainIndex = this.customChainIndex || mapping.chainIndex
    this.networkName = this.network

    return {}
  }
}

export default OKXChainSelectorNode

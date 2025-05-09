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
  PortObject,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { OKXConfig } from './types'

/**
 * Node for managing OKX DEX API configuration
 *
 * This node provides a centralized way to manage API credentials and configuration
 * for connecting to the OKX DEX API. Connect this node to other OKX API nodes.
 */
@Node({
  type: 'OKXConfigNode',
  title: 'OKX DEX: Configuration',
  description: 'Manages API credentials and configuration for the OKX DEX API',
  category: NODE_CATEGORIES.OKX_DEX,
  tags: ['okx', 'dex', 'config', 'credentials', 'api'],
})
class OKXConfigNode extends BaseNode {
  // @Input()
  // @String({
  //   title: 'API Key',
  //   description: 'OKX API Key for authentication',
  //   ui: { isPassword: true },
  // })
  // apiKey: string = ''
  //
  // @Input()
  // @String({
  //   title: 'Secret Key',
  //   description: 'OKX Secret Key for generating signatures',
  //   ui: { isPassword: true },
  // })
  // secretKey: string = ''
  //
  // @Input()
  // @String({
  //   title: 'API Passphrase',
  //   description: 'OKX API Passphrase for authentication',
  //   ui: { isPassword: true },
  // })
  // apiPassphrase: string = ''
  //
  // @Input()
  // @String({
  //   title: 'Project ID',
  //   description: 'OKX Project ID for API access',
  // })
  // projectId: string = ''
  //
  // @Input()
  // @String({
  //   title: 'Base URL',
  //   description: 'Optional custom base URL for API requests',
  //   defaultValue: 'https://web3.okx.com',
  // })
  // baseUrl: string = 'https://web3.okx.com'

  @Input()
  @PortObject({
    title: 'OKX Configuration Input',
    description: 'Complete configuration object for OKX API',
    schema: OKXConfig,
  })
  configInput: OKXConfig = new OKXConfig()

  @Output()
  @PortObject({
    title: 'OKX Configuration',
    description: 'Complete configuration object for OKX API',
    schema: OKXConfig,
  })
  config: OKXConfig = new OKXConfig()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Create and populate the configuration object
    this.config.apiKey = this.configInput.apiKey
    this.config.secretKey = this.configInput.secretKey
    this.config.apiPassphrase = this.configInput.apiPassphrase
    this.config.projectId = this.configInput.projectId
    this.config.baseUrl = this.configInput.baseUrl
    this.config.networks = this.configInput.networks
    this.config.solana = this.configInput.solana
    this.config.sui = this.configInput.sui
    this.config.evm = this.configInput.evm
    this.config.timeout = this.configInput.timeout
    this.config.maxRetries = this.configInput.maxRetries

    return {}
  }
}

export default OKXConfigNode

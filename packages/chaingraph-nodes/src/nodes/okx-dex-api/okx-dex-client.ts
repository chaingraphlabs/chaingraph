/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '@badaitech/chaingraph-types'
import type { OKXConfig as OKXDexClientConfig } from '@okx-dex/okx-dex-sdk/dist/types'
import type { OKXConfig } from 'src/nodes/okx-dex-api/types'
import { OKXDexClient } from '@okx-dex/okx-dex-sdk'

export async function createDexApiClient(
  context: ExecutionContext,
  config: OKXConfig,
): Promise<OKXDexClient> {
  if (!config || !config.secrets) {
    throw new Error('OKX configuration and secrets are required to create the client')
  }

  const secrets = await config.secrets.decrypt(context)

  // Initialize the OKX DEX client
  const okxConfig: OKXDexClientConfig = {
    apiKey: secrets.apiKey,
    secretKey: secrets.secretKey,
    apiPassphrase: secrets.apiPassphrase,
    projectId: config.projectId,
  }

  if (config.baseUrl) {
    okxConfig.baseUrl = config.baseUrl
  }
  if (config.timeout) {
    okxConfig.timeout = config.timeout
  }
  if (config.maxRetries) {
    okxConfig.maxRetries = config.maxRetries
  }
  if (config.networks) {
    okxConfig.networks = config.networks
  }

  return new OKXDexClient(okxConfig)
}

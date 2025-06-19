/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createConfig, http } from 'wagmi'
import { arbitrum, base, bsc, mainnet, optimism, polygon } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, bsc, arbitrum, optimism, base],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
})

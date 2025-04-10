/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { getStaticTRPCClient, setStaticTRPCClient } from '@/trpc/client'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SuperJSON from 'superjson'
import App from './App'
import { DefaultTRPCURL, RootProvider } from './providers/RootProvider'
import 'reflect-metadata'
import './reflect'
import '@xyflow/react/dist/style.css'
import './index.css'
import '@badaitech/chaingraph-nodes'

setStaticTRPCClient(getStaticTRPCClient())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootProvider
      // TODO: from ENV
      trpcURL={DefaultTRPCURL}
      superjsonCustom={SuperJSON}
      nodeRegistry={NodeRegistry.getInstance()}
    >
      <App />
    </RootProvider>
  </StrictMode>,
)

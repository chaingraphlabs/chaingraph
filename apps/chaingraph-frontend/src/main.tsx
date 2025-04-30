/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { appConfig } from '@/config'
import { NodeRegistry } from '@badaitech/chaingraph-types'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SuperJSON from 'superjson'
import App from './App'
import { RootProvider } from './providers/RootProvider'
import 'reflect-metadata'
import './reflect'
import '@badaitech/chaingraph-nodes'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootProvider
      trpcURL={appConfig.chaingraphTRPCWSUrl}
      superjsonCustom={SuperJSON}
      nodeRegistry={NodeRegistry.getInstance()}
    >
      <App />
    </RootProvider>
  </StrictMode>,
)

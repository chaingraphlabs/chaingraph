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
import '@radix-ui/themes/styles.css'
import '@xyflow/react/dist/style.css'
import './index.css'
import '@badaitech/chaingraph-nodes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootProvider
      // TODO: from ENV
      trpcURL={appConfig.chaingraphTRPCWSUrl}
      superjsonCustom={SuperJSON}
      nodeRegistry={NodeRegistry.getInstance()}
      // theme="light"
      // sessionToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImN2cnM0ZG1mYzN2dGthbjM1OTRnIiwidXNlcl9pZCI6IjQyMjg0YTA3LTZiODgtNDc2ZC1iYTQ0LTY2ZmFiZTFkNTRjOCIsInVzZXJfcm9sZSI6ImFkbWluIiwiaXNzIjoiYmFkYWkiLCJleHAiOjE3NDY4ODIzNTgsImlzX2FnZW50IjpmYWxzZX0.dUwM3uk2H0wgN2OSB9RPU4IzgvJ7vCQQ2VbwrH2yEBo"
    >
      <App />
    </RootProvider>
  </StrictMode>,
)

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { initializeJsonTransformers } from '@/lib/superjson-transformers'
import { initializeStores } from '@/store/init'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { RootProvider } from './providers/RootProvider'
import 'reflect-metadata'
import './reflect'
import '@xyflow/react/dist/style.css'
import './index.css'
import '@badaitech/chaingraph-nodes'

initializeJsonTransformers()
initializeStores().catch(console.error)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootProvider>
      <App />
    </RootProvider>
  </StrictMode>,
)

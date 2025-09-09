/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { NodeRegistry } from '@badaitech/chaingraph-types'
import { useUnit } from 'effector-react'
import { useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SuperJSON from 'superjson'
import { appConfig } from './config'
import { RootProvider } from './exports'
import { FlowLayout } from './FlowLayout'
import {
  $initializationProgress,
  $isAppReady,
  initChainGraph,
  sessionProviders,
} from './store/initialization'

function App() {
  const initStartedRef = useRef(false)
  const isAppReady = useUnit($isAppReady)
  const initProgress = useUnit($initializationProgress)

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initStartedRef.current)
      return
    initStartedRef.current = true

    // Using the same API as external developers would use!
    // Just with ArchAI session provider
    initChainGraph(sessionProviders.archAI, {
      trpcMainURL: appConfig.chaingraphTRPCWSUrl || 'ws://localhost:3001',
      trpcExecutorURL: appConfig.chaingraphExecutorWSUrl || 'ws://localhost:4021',
      superjsonCustom: SuperJSON,
      nodeRegistry: NodeRegistry.getInstance(),
    }).catch(console.error)

    // External developers would use it like:
    //
    // import { initChainGraph, sessionProviders } from '@badaitech/chaingraph-frontend'
    //
    // // Option 1: With a static session token
    // initChainGraph('your-session-token', {
    //   trpcMainURL: 'ws://your-server:3001',
    //   trpcExecutorURL: 'ws://your-server:4021',
    // })
    //
    // // Option 2: With environment variable
    // initChainGraph(sessionProviders.env, {
    //   trpcMainURL: 'ws://your-server:3001',
    //   trpcExecutorURL: 'ws://your-server:4021',
    // })
    //
    // // Option 3: With async session loading
    // initChainGraph(async () => {
    //   const response = await fetch('/api/auth')
    //   const data = await response.json()
    //   return data.sessionToken
    // }, {
    //   trpcMainURL: 'ws://your-server:3001',
    //   trpcExecutorURL: 'ws://your-server:4021',
    // })
  }, [])

  // Show loading state while initializing
  if (!isAppReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">Loading ChainGraph...</div>
          <div className="text-sm text-gray-500">
            {initProgress === 'setting-session' && 'Setting up session...'}
            {initProgress === 'initializing-registry' && 'Initializing node registry...'}
            {initProgress === 'creating-clients' && 'Connecting to servers...'}
            {initProgress === 'fetching-data' && 'Fetching data...'}
            {initProgress === 'error' && 'Initialization failed'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/flows" replace />} />
        <Route element={<RootProvider />}>
          <Route path="/flows" element={<FlowLayout />} />
          <Route path="/flow/:flowId" element={<FlowLayout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

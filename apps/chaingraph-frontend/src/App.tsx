/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { NodeRegistry } from '@badaitech/chaingraph-types'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import SuperJSON from 'superjson'
import { PerfTracePanel } from './components/debug/PerfTracePanel'
import { appConfig } from './config'
import { FlowLayout } from './FlowLayout'
import { ChainGraphProvider } from './providers/ChainGraphProvider'
import { sessionProviders } from './store/initialization'
import { initializePerfTracing } from './store/perf-trace'

// Initialize performance tracing system (dev mode only)
if (import.meta.env.DEV) {
  initializePerfTracing()
}

// Component that handles routes and extracts flowId
function AppRoutes() {
  const { flowId } = useParams()

  return <FlowLayout />
}

// Main App component wrapper
function AppContent() {
  return (
    <Routes>
      <Route path="/flow/:flowId" element={<AppRoutes />} />
      <Route path="/" element={<FlowLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ChainGraphProvider
      session={sessionProviders.archAI}
      config={{
        trpcMainURL: appConfig.chaingraphTRPCWSUrl || 'ws://localhost:3001',
        trpcExecutorURL: appConfig.chaingraphExecutorWSUrl || 'ws://localhost:4021',
        superjsonCustom: SuperJSON,
        nodeRegistry: NodeRegistry.getInstance(),
      }}
      theme="dark"
    >
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      {/* Performance trace panel - only visible in dev mode */}
      <PerfTracePanel />
    </ChainGraphProvider>
  )
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useExecutionSubscription } from '@/store/execution'
import { ReactFlowProvider } from '@xyflow/react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Flow from './components/flow/Flow'
import { Sidebar } from './components/sidebar/Sidebar'
import { ThemeToggle } from './components/theme/ThemeToggle'

function FlowLayout() {
  useExecutionSubscription()

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </div>
      <ThemeToggle />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/flows" replace />} />
        <Route path="/flows" element={<FlowLayout />} />
        <Route path="/flow/:flowId" element={<FlowLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

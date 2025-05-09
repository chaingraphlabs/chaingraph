/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { NodeRegistry } from '@badaitech/chaingraph-types'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import SuperJSON from 'superjson'
import { appConfig } from './config'
import { RootProvider } from './exports'
import { FlowLayout } from './FlowLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/flows" replace />} />
        <Route element={(
          <RootProvider
            trpcURL={appConfig.chaingraphTRPCWSUrl}
            superjsonCustom={SuperJSON}
            nodeRegistry={NodeRegistry.getInstance()}
            sessionToken={import.meta.env.VITE_CHAINGRAPH_SESSION_TOKEN || ''}
          />
        )}
        >
          <Route path="/flows" element={<FlowLayout />} />
          <Route path="/flow/:flowId" element={<FlowLayout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

// export default App
export default App

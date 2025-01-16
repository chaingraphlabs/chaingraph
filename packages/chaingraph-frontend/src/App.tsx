import { Flex } from '@radix-ui/themes'
import { ReactFlowProvider } from '@xyflow/react'
import React from 'react'
import Flow from './components/flow/Flow'
import { NodeList } from './components/nodes/node-list'
import { Providers } from './providers'

function App() {
  return (
    <Providers>
      <Flex direction="row" style={{ height: '100vh' }}>

        <div className="w-80 border-r overflow-y-auto">
          <NodeList />
        </div>

        {/* Flow Editor */}
        <div className="flex-1">
          <ReactFlowProvider>
            <Flow />
          </ReactFlowProvider>
        </div>
      </Flex>
    </Providers>
  )
}

export default App

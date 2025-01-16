import { Flex } from '@radix-ui/themes'
import { ReactFlowProvider } from '@xyflow/react'
import Flow from './components/flow/Flow.tsx'
import { Sidebar } from './components/sidebar/Sidebar.tsx'
import { ThemeToggle } from './components/theme/ThemeToggle.tsx'

function App() {
  return (
    <Flex direction="row" style={{ height: '100vh' }}>
      <Sidebar />

      <div className="flex-1">
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </div>

      {/* Theme Toggle Button */}
      <ThemeToggle />
    </Flex>
  )
}

export default App

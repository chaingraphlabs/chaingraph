import { ReactFlowProvider } from '@xyflow/react'
import Flow from './components/flow/Flow.tsx'
import { Sidebar } from './components/sidebar/Sidebar.tsx'
import { ThemeToggle } from './components/theme/ThemeToggle.tsx'

function App() {
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

export default App

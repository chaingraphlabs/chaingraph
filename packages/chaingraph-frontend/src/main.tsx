import { nodeRegistry } from '@chaingraph/nodes'
import {
  registerFlowTransformers,
  registerNodeTransformers,
  registerPortTransformers,
} from '@chaingraph/types'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { RootProvider } from './providers/RootProvider.tsx'
import './index.css'
import './reflect'

registerPortTransformers()
registerNodeTransformers(nodeRegistry)
registerFlowTransformers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootProvider>
      <App />
    </RootProvider>
  </StrictMode>,
)

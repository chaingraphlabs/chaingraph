import { nodeRegistry } from '@chaingraph/nodes'
import {
  registerFlowTransformers,
  registerNodeTransformers,
  registerPortTransformers,
} from '@chaingraph/types'
import { Theme } from '@radix-ui/themes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import '@radix-ui/themes/styles.css'
import './reflect'

registerPortTransformers()
registerNodeTransformers(nodeRegistry)
registerFlowTransformers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme
      accentColor="grass"
      grayColor="gray"
      radius="small"
      scaling="90%"
      appearance="dark"
    >
      <App />
      {/* <ThemePanel /> */}
    </Theme>
  </StrictMode>,
)

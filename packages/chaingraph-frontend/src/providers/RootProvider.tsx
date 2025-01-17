import type { PropsWithChildren } from 'react'
import { DndContextProvider } from '@/components/dnd'
import { TrpcProvider } from '@chaingraph/frontend/api/trpc/provider.tsx'
import { DndProvider } from '@chaingraph/frontend/components/dnd/DndProvider.tsx'
import { ThemeProvider } from '@chaingraph/frontend/components/theme/ThemeProvider.tsx'
import { ReactFlowProvider } from '@xyflow/react'
import { FlowProvider } from './FlowProvider'

export function RootProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <TrpcProvider>
        <FlowProvider>
          <DndContextProvider>
            <DndProvider>
              <ReactFlowProvider>
                {children}
              </ReactFlowProvider>
            </DndProvider>
          </DndContextProvider>
        </FlowProvider>
      </TrpcProvider>
    </ThemeProvider>
  )
}

import type { PropsWithChildren } from 'react'
import { DndContextProvider } from '@/components/dnd'
import { MenuPositionProvider } from '@/components/flow/context-menu'
import { ZoomProvider } from '@/providers/ZoomProvider'
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
          <ReactFlowProvider>
            <ZoomProvider>
              <DndContextProvider>
                <DndProvider>
                  <MenuPositionProvider>
                    {children}
                  </MenuPositionProvider>
                </DndProvider>
              </DndContextProvider>
            </ZoomProvider>
          </ReactFlowProvider>
        </FlowProvider>
      </TrpcProvider>
    </ThemeProvider>
  )
}

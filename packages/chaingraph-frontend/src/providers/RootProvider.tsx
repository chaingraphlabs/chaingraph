import type { PropsWithChildren } from 'react'
import { DndContextProvider } from '@/components/dnd'
import { ZoomProvider } from '@/providers/ZoomProvider'
import { TrpcProvider } from '@chaingraph/frontend/api/trpc/provider.tsx'
import { DndProvider } from '@chaingraph/frontend/components/dnd/DndProvider.tsx'
import { ThemeProvider } from '@chaingraph/frontend/components/theme/ThemeProvider.tsx'
import { ReactFlowProvider } from '@xyflow/react'
import { MenuPositionProvider } from 'src/components/flow/components/context-menu'

export function RootProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <TrpcProvider>
        {/* <NodeCategoriesProvider> */}
        {/* <FlowProvider> */}
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
        {/* </FlowProvider> */}
        {/* </NodeCategoriesProvider> */}
      </TrpcProvider>
    </ThemeProvider>
  )
}

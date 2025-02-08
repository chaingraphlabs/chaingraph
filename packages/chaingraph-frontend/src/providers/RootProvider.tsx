/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PropsWithChildren } from 'react'
import { DndContextProvider } from '@/components/dnd'
import { ZoomProvider } from '@/providers/ZoomProvider'
import { TrpcProvider } from '@badaitech/chaingraph-frontend/api/trpc/provider.tsx'
import { DndProvider } from '@badaitech/chaingraph-frontend/components/dnd/DndProvider.tsx'
import { ThemeProvider } from '@badaitech/chaingraph-frontend/components/theme/ThemeProvider.tsx'
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

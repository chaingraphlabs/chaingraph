/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PropsWithChildren } from 'react'
import { TrpcProvider } from '@/api/trpc/provider'
import { DndContextProvider, DndProvider } from '@/components/dnd'
import { MenuPositionProvider } from '@/components/flow/components/context-menu'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { ZoomProvider } from '@/providers/ZoomProvider'
import { ReactFlowProvider } from '@xyflow/react'

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

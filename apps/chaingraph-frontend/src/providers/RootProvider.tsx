/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategorizedNodes, FlowMetadata } from '@badaitech/chaingraph-types'
import { TooltipProvider } from '@/components/ui'

import { initializeStores } from '@/store/init'
import { setStaticTRPCClient } from '@/trpc/client'
import { initializeNodes } from '@badaitech/chaingraph-nodes'
import {
  createTRPCClient,
  getQueryClient,
  TRPCProvider,
} from '@badaitech/chaingraph-trpc/client'
import {

  NodeRegistry,
  registerSuperjsonTransformers,
} from '@badaitech/chaingraph-types'
import { Theme } from '@radix-ui/themes'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactFlowProvider } from '@xyflow/react'
import { useState } from 'react'
import SuperJSON from 'superjson'
import { DndContextProvider, DndProvider } from '../components/dnd'
import { MenuPositionProvider } from '../components/flow/components/context-menu'
import { ZoomProvider } from './ZoomProvider'

interface RootProviderProps {
  children: React.ReactNode
  trpcURL?: string
  superjsonCustom?: typeof SuperJSON
  nodeRegistry?: NodeRegistry
}

export const DefaultTRPCURL = `ws://localhost:3001`

export function RootProvider({
  children,
  trpcURL,
  superjsonCustom,
  nodeRegistry,
}: RootProviderProps) {
  initializeNodes((_nodeRegistry: NodeRegistry) => {
    if (nodeRegistry) {
      nodeRegistry.copyFrom(_nodeRegistry)
    }

    NodeRegistry.setInstance(nodeRegistry ?? _nodeRegistry)
  })

  // Static tRPC needs for the effector effects
  setStaticTRPCClient(createTRPCClient({
    url: trpcURL ?? DefaultTRPCURL,
    superjsonCustom: superjsonCustom ?? SuperJSON,
  }))

  initializeStores((categorizedNodes: CategorizedNodes[], flows: FlowMetadata[]) => {
    console.log('Stores initialized successfully')
    // callback with the results
    console.log('Categorized Nodes:', categorizedNodes)
    console.log('Flows:', flows)
  }).catch(console.error)

  registerSuperjsonTransformers(
    superjsonCustom ?? SuperJSON,
    NodeRegistry.getInstance(),
  )

  const queryClient = getQueryClient()
  const [trpcClient] = useState(() => createTRPCClient({
    url: trpcURL ?? DefaultTRPCURL,
    superjsonCustom: superjsonCustom ?? SuperJSON,
  }))

  return (
    // <ThemeProvider>
    <Theme appearance="dark">
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
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
          </TRPCProvider>
        </QueryClientProvider>
      </TooltipProvider>
    </Theme>
    // </ThemeProvider>
  )
}

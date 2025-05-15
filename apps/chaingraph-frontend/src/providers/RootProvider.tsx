/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CSSProperties } from 'react'
import { TooltipProvider } from '@/components/ui'
import { ShadowWithStyles } from '@/components/ui/shadow'
import { initializeStores, reset } from '@/store/init'
import { $trpcClient, createTRPCClientEvent } from '@/store/trpc/store'
import { initializeNodes } from '@badaitech/chaingraph-nodes'
import {
  getQueryClient,
  TRPCProvider,
} from '@badaitech/chaingraph-trpc/client'
import {
  NodeRegistry,
  registerSuperjsonTransformers,
} from '@badaitech/chaingraph-types'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactFlowProvider } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import SuperJSON from 'superjson'
import { DndContextProvider, DndProvider } from '../components/dnd'
import { MenuPositionProvider } from '../components/flow/components/context-menu'
import { ThemeProvider } from '../components/theme/ThemeProvider'
import { ZoomProvider } from './ZoomProvider'
import '../store'

interface RootProviderProps {
  wrapperClassName?: string
  className?: string
  style?: CSSProperties
  trpcURL?: string
  sessionToken?: string
  superjsonCustom?: typeof SuperJSON
  nodeRegistry?: NodeRegistry
  theme?: 'dark' | 'light'

  children?: React.ReactNode
}

export const DefaultTRPCURL = `ws://localhost:3001`

export function RootProvider({
  wrapperClassName,
  className,
  style,
  children,
  trpcURL,
  sessionToken,
  superjsonCustom,
  nodeRegistry,
  theme,
}: RootProviderProps) {
  // Use ref to track initialization state
  const isInitializedRef = useRef(false)
  const sessionTokenRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (sessionToken) {
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = sessionToken
        console.debug('Session token initialized:', sessionTokenRef.current)
      } else {
        if (sessionTokenRef.current !== sessionToken) {
          console.warn('Session token changed, reinitializing stores')
          sessionTokenRef.current = sessionToken
          isInitializedRef.current = false
          reset()
        }
      }
    } else {
      console.warn('Session token is undefined, using default value')
    }

    if (!isInitializedRef.current) {
      isInitializedRef.current = true
      // effector logger
      // if (process.env.NODE_ENV === 'development') {
      //   attachLogger()
      // }

      initializeNodes((_nodeRegistry: NodeRegistry) => {
        if (nodeRegistry) {
          nodeRegistry.copyFrom(_nodeRegistry)
        }

        NodeRegistry.setInstance(nodeRegistry ?? _nodeRegistry)
      })

      registerSuperjsonTransformers(
        superjsonCustom ?? SuperJSON,
        NodeRegistry.getInstance(),
      )

      createTRPCClientEvent({
        sessionBadAI: sessionTokenRef.current,
        trpcURL: trpcURL ?? DefaultTRPCURL,
        superjsonCustom: superjsonCustom ?? SuperJSON,
      })

      initializeStores((categorizedNodes, flows) => {
        console.debug('Stores initialized successfully')
        console.debug('Categorized Nodes:', categorizedNodes)
        console.debug('Flows:', flows)
      }).catch(console.error)
    }

    return () => {
      if (isInitializedRef.current) {
        isInitializedRef.current = false
        reset()
      }
    }
  }, [nodeRegistry, sessionToken, superjsonCustom, trpcURL])

  const queryClient = getQueryClient()
  const trpcClient = useUnit($trpcClient)

  return (
    <ShadowWithStyles className={wrapperClassName}>
      <ThemeProvider className={className} style={style} theme={theme}>

        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
              <ReactFlowProvider>
                <ZoomProvider>
                  <DndContextProvider>
                    <DndProvider>
                      <MenuPositionProvider>
                        {children ?? <Outlet />}
                      </MenuPositionProvider>
                    </DndProvider>
                  </DndContextProvider>
                </ZoomProvider>
              </ReactFlowProvider>
            </TRPCProvider>
          </QueryClientProvider>
        </TooltipProvider>
        <div id="chaingraph-portal" />
      </ThemeProvider>
    </ShadowWithStyles>
  )
}

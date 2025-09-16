/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CSSProperties } from 'react'
import {
  TRPCProvider as ExecutorTRPCProvider,
  getExecutorQueryClient,
} from '@badaitech/chaingraph-executor/client'
import {
  getMainQueryClient,
  TRPCProvider as MainTRPCProvider,
} from '@badaitech/chaingraph-trpc/client'
import { ReactFlowProvider } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui'
import { ShadowWithStyles } from '@/components/ui/shadow'
import { $trpcClientExecutor } from '@/store/trpc/execution-client'
import { $trpcClient } from '@/store/trpc/store'
import { DndContextProvider, DndProvider } from '../components/dnd'
import { MenuPositionProvider } from '../components/flow/components/context-menu'
import { ThemeProvider } from '../components/theme/ThemeProvider'
import { WagmiProvider } from '../components/wallet/WagmiProvider'
import { ZoomProvider } from './ZoomProvider'
import '../store'

interface RootProviderProps {
  wrapperClassName?: string
  className?: string
  style?: CSSProperties
  theme?: 'dark' | 'light'
  children?: React.ReactNode
}

export function RootProvider({
  wrapperClassName,
  className,
  style,
  children,
  theme,
}: RootProviderProps) {
  // Create separate query clients for each tRPC server
  const queryClientMain = useMemo(() => getMainQueryClient(), [])
  const queryClientExecutor = useMemo(() => getExecutorQueryClient(), [])

  const trpcClient = useUnit($trpcClient)
  const trpcClientExecutor = useUnit($trpcClientExecutor)

  return (
    <ShadowWithStyles className={wrapperClassName}>
      <ThemeProvider className={className} style={style} theme={theme}>
        <TooltipProvider>
          <WagmiProvider>
            <MainTRPCProvider trpcClient={trpcClient} queryClient={queryClientMain}>
              <ExecutorTRPCProvider trpcClient={trpcClientExecutor} queryClient={queryClientExecutor}>
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
              </ExecutorTRPCProvider>
            </MainTRPCProvider>
          </WagmiProvider>
        </TooltipProvider>
        <div id="chaingraph-portal" />
      </ThemeProvider>
    </ShadowWithStyles>
  )
}

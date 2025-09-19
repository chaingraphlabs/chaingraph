/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CSSProperties } from 'react'

import { ReactFlowProvider } from '@xyflow/react'
import { Outlet } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui'
import { ShadowWithStyles } from '@/components/ui/shadow'
import { DndContextProvider, DndProvider } from '../components/dnd'
import { MenuPositionProvider } from '../components/flow/components/context-menu'
import { ThemeProvider } from '../components/theme/ThemeProvider'
import { WagmiProvider } from '../components/wallet/WagmiProvider'
import { ZoomProvider } from './ZoomProvider'

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
  // const queryClientMain = useMemo(() => getMainQueryClient(), [])
  // const queryClientExecutor = useMemo(() => getExecutorQueryClient(), [])

  // const trpcClient = useUnit($trpcClient)
  // const trpcClientExecutor = useUnit($trpcClientExecutor)

  return (
    <ShadowWithStyles className={wrapperClassName}>
      <ThemeProvider className={className} style={style} theme={theme}>
        <TooltipProvider>
          <WagmiProvider>
            {/* <MainTRPCProvider trpcClient={trpcClient} queryClient={queryClientMain}> */}
            {/*  <ExecutorTRPCProvider trpcClient={trpcClientExecutor} queryClient={queryClientExecutor}> */}
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
            {/* </ExecutorTRPCProvider> */}
            {/* </MainTRPCProvider> */}
          </WagmiProvider>
        </TooltipProvider>
        <div id="chaingraph-portal" />
      </ThemeProvider>
    </ShadowWithStyles>
  )
}

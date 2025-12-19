/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '@badaitech/chaingraph-types'
import type { ReactNode } from 'react'
import Color from 'color'
import { useUnit } from 'effector-react'
import { useEffect, useState } from 'react'
import { useTheme } from '@/components/theme'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { $isConnecting } from '@/store/edges/stores'
import { usePortConfig, usePortUI } from '@/store/ports-v2'
import { getPortTypeColor } from './getPortTypeColor'
import { PortDocContent } from './PortDocContent'

interface PortDocTooltipProps {
  nodeId: string
  portId: string
  children: ReactNode
  className?: string
}

export function PortDocTooltip({
  nodeId,
  portId,
  children,
  className,
}: PortDocTooltipProps) {
  const isConnecting = useUnit($isConnecting)
  const [isOpen, setIsOpen] = useState(false)

  const config = usePortConfig(nodeId, portId)
  const ui = usePortUI(nodeId, portId)

  useEffect(() => {
    if (isConnecting) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsOpen(false)
    }
  }, [isConnecting])

  const { theme } = useTheme()
  // Merge config with UI for color calculation (UI is stored separately in ports-v2)
  const configWithUI = config ? { ...config, ui } as IPortConfig : null
  const portColor = configWithUI ? getPortTypeColor(theme, configWithUI) : { borderColor: '#a1a1a1', bgColor: '#a1a1a1' }

  // Convert the hex border color to RGB components for the shadow
  const colorObj = new Color(
    theme === 'dark'
      ? portColor.borderColor
      : new Color(portColor.borderColor)
          .desaturate(0.7)
          .darken(0.2)
          .hex(),
  )
  const r = colorObj.red()
  const g = colorObj.green()
  const b = colorObj.blue()

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip open={!isConnecting && isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          {/* <div className={cn('relative', className)}> */}
          {children}
          {/* </div> */}
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={32}
          className={cn(
            'p-0 border-0 bg-transparent select-text',
          )}
          style={{
            boxShadow: `0 0 25px rgba(${r},${g},${b},0.9)`,
          }}
        >
          <div className="pointer-events-auto">
            <PortDocContent nodeId={nodeId} portId={portId} />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

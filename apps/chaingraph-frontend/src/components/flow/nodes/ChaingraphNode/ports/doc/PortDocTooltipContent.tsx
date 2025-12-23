/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '@badaitech/chaingraph-types'
import Color from 'color'
import { useTheme } from '@/components/theme'
import {
  TooltipContent,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { usePortConfig, usePortUI } from '@/store/ports-v2'
import { getPortTypeColor } from './getPortTypeColor'
import { PortDocContent } from './PortDocContent'

interface PortDocTooltipContentProps {
  nodeId: string
  portId: string
  className?: string
}

/**
 * Heavy tooltip body rendered lazily on demand to avoid subscribing to port stores
 * for every port on the canvas.
 */
export function PortDocTooltipContent({
  nodeId,
  portId,
  className,
}: PortDocTooltipContentProps) {
  const config = usePortConfig(nodeId, portId)
  const ui = usePortUI(nodeId, portId)
  const { theme } = useTheme()

  // Merge config with UI for color calculation (UI is stored separately in ports-v2)
  const configWithUI = config ? { ...config, ui } as IPortConfig : null
  const portColor = configWithUI
    ? getPortTypeColor(theme, configWithUI)
    : { borderColor: '#a1a1a1', bgColor: '#a1a1a1' }

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
    <TooltipContent
      side="right"
      align="center"
      sideOffset={32}
      className={cn(
        'p-0 border-0 bg-transparent select-text',
        className,
      )}
      style={{
        boxShadow: `0 0 25px rgba(${r},${g},${b},0.9)`,
      }}
    >
      <div className="pointer-events-auto">
        <PortDocContent nodeId={nodeId} portId={portId} />
      </div>
    </TooltipContent>
  )
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionStatus } from './types'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CornerDownRightIcon,
} from 'lucide-react'

interface DebugControlsProps {
  status: ExecutionStatus
  breakpointHit: boolean
  onStepOver: () => void
  onStepInto: () => void
  onStepOut: () => void
}

export function DebugControls({
  status,
  breakpointHit,
  onStepOver,
  onStepInto,
  onStepOut,
}: DebugControlsProps) {
  const isEnabled = status === 'paused' && breakpointHit

  return (
    <motion.div
      className="flex items-center gap-1"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 'auto', opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Step Over */}
      <Button
        variant="ghost"
        size="icon"
        disabled={!isEnabled}
        onClick={onStepOver}
        title="Step Over (F10)"
      >
        <CornerDownRightIcon className="w-4 h-4" />
      </Button>

      {/* Step Into */}
      <Button
        variant="ghost"
        size="icon"
        disabled={!isEnabled}
        onClick={onStepInto}
        title="Step Into (F11)"
      >
        <ArrowDownIcon className="w-4 h-4" />
      </Button>

      {/* Step Out */}
      <Button
        variant="ghost"
        size="icon"
        disabled={!isEnabled}
        onClick={onStepOut}
        title="Step Out (Shift+F11)"
      >
        <ArrowUpIcon className="w-4 h-4" />
      </Button>
    </motion.div>
  )
}

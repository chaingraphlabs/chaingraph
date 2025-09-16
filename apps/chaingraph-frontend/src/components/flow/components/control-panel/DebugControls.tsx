/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { motion } from 'framer-motion'
import { RedoDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { stepExecution } from '@/store/execution'

const MotionButton = motion(Button)

interface DebugControlsProps {
  executionId: string
  canControl: boolean
}

export function DebugControls({ executionId, canControl }: DebugControlsProps) {
  return (
    <motion.div
      className="flex items-center gap-1 pl-1"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 'auto', opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <MotionButton
            variant="ghost"
            size="icon"
            disabled={!canControl}
            onClick={() => stepExecution(executionId)}
            title="Step Over (F10)"
            className="rounded-full"
            whileHover={{
              x: [0, -2, 4, -2, 0],
              transition: { duration: 0.3 },
            }}
            whileTap={{ scale: 0.9 }}
          >
            <RedoDot className="w-4 h-4" />
          </MotionButton>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Step Over - Execute next node
        </TooltipContent>
      </Tooltip>
    </motion.div>
  )
}

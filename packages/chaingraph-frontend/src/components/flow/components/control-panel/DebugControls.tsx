import type { ExecutionStatus } from './types'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.tsx'
import { motion } from 'framer-motion'
import {
  RedoDot,
} from 'lucide-react'

const MotionButton = motion(Button)

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
      className="flex items-center gap-1 pl-1"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 'auto', opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Step Over */}
          <MotionButton
            variant="ghost"
            size="icon"
            disabled={!isEnabled}
            onClick={onStepOver}
            title="Step Over (F10)"
            className="rounded-full"
            whileHover={{
              x: [0, -2, 4, -2, 0],
              transition: { duration: 0.3 },
            }}
            whileTap={{ scale: 0.9 }}
          >
            {/* <CornerDownRightIcon className="w-4 h-4" /> */}
            <RedoDot className="w-4 h-4" />
          </MotionButton>

        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Step Over - Execute next node
        </TooltipContent>
      </Tooltip>

      {/* /!* Step Into *!/ */}
      {/* <MotionButton */}
      {/*  variant="ghost" */}
      {/*  size="icon" */}
      {/*  disabled={!isEnabled} */}
      {/*  onClick={onStepInto} */}
      {/*  title="Step Into (F11)" */}
      {/*  className="rounded-full" */}
      {/*  whileHover={{ */}
      {/*    y: [0, -2, 2, -2, 0], */}
      {/*    transition: { duration: 0.3 }, */}
      {/*  }} */}
      {/*  whileTap={{ scale: 0.9 }} */}
      {/* > */}
      {/*  <ArrowDownIcon className="w-4 h-4" /> */}
      {/* </MotionButton> */}

      {/* /!* Step Out *!/ */}
      {/* <MotionButton */}
      {/*  variant="ghost" */}
      {/*  size="icon" */}
      {/*  disabled={!isEnabled} */}
      {/*  onClick={onStepOut} */}
      {/*  title="Step Out (Shift+F11)" */}
      {/*  className="rounded-full" */}
      {/*  whileHover={{ */}
      {/*    y: [0, 2, -2, 2, 0], */}
      {/*    transition: { duration: 0.3 }, */}
      {/*  }} */}
      {/*  whileTap={{ scale: 0.9 }} */}
      {/* > */}
      {/*  <ArrowUpIcon className="w-4 h-4" /> */}
      {/* </MotionButton> */}
    </motion.div>
  )
}

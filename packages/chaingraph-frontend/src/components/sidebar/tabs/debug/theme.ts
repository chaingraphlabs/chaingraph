/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  LucideIcon,
} from 'lucide-react'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRightFromLine,
  ArrowRightToLine,
  Ban,
  Bug,
  CheckCircle2,
  CircleDot,
  CircleOff,
  Cpu,
  Pause,
  Play,
  PlayCircle,
  TimerReset,
  XCircle,
} from 'lucide-react'

export interface EventTheme {
  icon: LucideIcon
  color: {
    light: string
    dark: string
  }
  bgColor: {
    light: string
    dark: string
  }
  borderColor?: {
    light: string
    dark: string
  }
}

export const eventThemes: Record<ExecutionEventEnum, EventTheme> = {
  // Flow Events
  [ExecutionEventEnum.FLOW_SUBSCRIBED]: {
    icon: PlayCircle,
    color: {
      light: 'text-indigo-700',
      dark: 'text-indigo-300',
    },
    bgColor: {
      light: 'bg-indigo-50',
      dark: 'bg-indigo-500/10',
    },
  },
  [ExecutionEventEnum.FLOW_STARTED]: {
    icon: Play,
    color: {
      light: 'text-blue-700',
      dark: 'text-blue-300',
    },
    bgColor: {
      light: 'bg-blue-50',
      dark: 'bg-blue-500/10',
    },
  },
  [ExecutionEventEnum.FLOW_COMPLETED]: {
    icon: CheckCircle2,
    color: {
      light: 'text-green-700',
      dark: 'text-green-300',
    },
    bgColor: {
      light: 'bg-green-50',
      dark: 'bg-green-500/10',
    },
  },
  [ExecutionEventEnum.FLOW_FAILED]: {
    icon: XCircle,
    color: {
      light: 'text-red-700',
      dark: 'text-red-300',
    },
    bgColor: {
      light: 'bg-red-50',
      dark: 'bg-red-500/10',
    },
  },
  [ExecutionEventEnum.FLOW_CANCELLED]: {
    icon: Ban,
    color: {
      light: 'text-rose-700',
      dark: 'text-rose-300',
    },
    bgColor: {
      light: 'bg-rose-50',
      dark: 'bg-rose-500/10',
    },
  },
  [ExecutionEventEnum.FLOW_PAUSED]: {
    icon: Pause,
    color: {
      light: 'text-yellow-700',
      dark: 'text-yellow-200',
    },
    bgColor: {
      light: 'bg-yellow-50',
      dark: 'bg-yellow-500/10',
    },
  },
  [ExecutionEventEnum.FLOW_RESUMED]: {
    icon: TimerReset,
    color: {
      light: 'text-amber-700',
      dark: 'text-amber-200',
    },
    bgColor: {
      light: 'bg-amber-50',
      dark: 'bg-amber-500/10',
    },
  },

  // Node Events
  [ExecutionEventEnum.NODE_STARTED]: {
    icon: Cpu,
    color: {
      light: 'text-purple-700',
      dark: 'text-purple-300',
    },
    bgColor: {
      light: 'bg-purple-50',
      dark: 'bg-purple-500/10',
    },
  },
  [ExecutionEventEnum.NODE_COMPLETED]: {
    icon: CheckCircle2,
    color: {
      light: 'text-green-700',
      dark: 'text-green-300',
    },
    bgColor: {
      light: 'bg-green-50',
      dark: 'bg-green-500/10',
    },
  },
  [ExecutionEventEnum.NODE_FAILED]: {
    icon: AlertTriangle,
    color: {
      light: 'text-red-700',
      dark: 'text-red-300',
    },
    bgColor: {
      light: 'bg-red-50',
      dark: 'bg-red-500/10',
    },
  },
  [ExecutionEventEnum.NODE_SKIPPED]: {
    icon: CircleOff,
    color: {
      light: 'text-slate-700',
      dark: 'text-slate-300',
    },
    bgColor: {
      light: 'bg-slate-50',
      dark: 'bg-slate-500/10',
    },
  },
  [ExecutionEventEnum.NODE_STATUS_CHANGED]: {
    icon: CircleDot,
    color: {
      light: 'text-violet-700',
      dark: 'text-violet-300',
    },
    bgColor: {
      light: 'bg-violet-50',
      dark: 'bg-violet-500/10',
    },
  },

  // Edge Events
  [ExecutionEventEnum.EDGE_TRANSFER_STARTED]: {
    icon: ArrowRightFromLine,
    color: {
      light: 'text-cyan-700',
      dark: 'text-cyan-300',
    },
    bgColor: {
      light: 'bg-cyan-50',
      dark: 'bg-cyan-500/10',
    },
  },
  [ExecutionEventEnum.EDGE_TRANSFER_COMPLETED]: {
    icon: ArrowRightToLine,
    color: {
      light: 'text-teal-700',
      dark: 'text-teal-300',
    },
    bgColor: {
      light: 'bg-teal-50',
      dark: 'bg-teal-500/10',
    },
  },
  [ExecutionEventEnum.EDGE_TRANSFER_FAILED]: {
    icon: AlertOctagon,
    color: {
      light: 'text-red-700',
      dark: 'text-red-300',
    },
    bgColor: {
      light: 'bg-red-50',
      dark: 'bg-red-500/10',
    },
  },

  // Debug Events
  [ExecutionEventEnum.DEBUG_BREAKPOINT_HIT]: {
    icon: Bug,
    color: {
      light: 'text-orange-700',
      dark: 'text-orange-300',
    },
    bgColor: {
      light: 'bg-orange-50',
      dark: 'bg-orange-500/10',
    },
  },
}

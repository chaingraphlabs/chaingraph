/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export type DebuggerCommand = 'continue' | 'step' | 'stop'

export interface DebuggerState {
  isPaused: boolean
  currentNode: string | null
  breakpoints: Set<string>
  pausedNodes: Set<string>
}

export interface DebuggerController {
  pause: () => void
  continue: () => void
  step: () => void
  stop: () => void
  addBreakpoint: (nodeId: string) => void
  removeBreakpoint: (nodeId: string) => void
  getState: () => DebuggerState
}

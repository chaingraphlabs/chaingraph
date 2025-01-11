export type DebuggerCommand = 'continue' | 'step' | 'stop'

export interface DebuggerState {
  isPaused: boolean
  currentNode: string | null
  breakpoints: Set<string>
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

import type { INode } from '@chaingraph/types'
import type { DebuggerCommand, DebuggerController, DebuggerState } from './debugger-types'

export class FlowDebugger implements DebuggerController {
  private state: DebuggerState = {
    isPaused: false,
    currentNode: null,
    breakpoints: new Set(),
    pausedNodes: new Set(),
  }

  private commandResolvers: Map<string, (command: DebuggerCommand) => void> = new Map()
  private stopRequested: boolean = false

  private readonly onBreakpointHit?: (node: INode) => void

  constructor(
    onBreakpointHit?: (node: INode) => void,
  ) {
    this.onBreakpointHit = onBreakpointHit
    this.reset()
  }

  private reset() {
    this.state = {
      isPaused: false,
      currentNode: null,
      breakpoints: new Set(),
      pausedNodes: new Set(),
    }
    this.stopRequested = false
    this.commandResolvers.clear()
  }

  public pause(): void {
    this.state.isPaused = true
  }

  public continue(): void {
    this.commandResolvers.forEach((resolver) => {
      resolver('continue')
    })
    this.commandResolvers.clear()
    this.state.isPaused = false
  }

  public step(): void {
    this.commandResolvers.forEach((resolver) => {
      resolver('step')
    })
    this.commandResolvers.clear()
    // If we're still in paused mode, we need to wait for nodes to hit the next breakpoint
    // Otherwise, if there are no more nodes to pause, we can reset the paused state
    // if (this.commandResolvers.size === 0 && this.state.breakpoints.size === 0) {
    //   this.state.isPaused = false
    // }
  }

  public stop(): void {
    this.stopRequested = true
    this.commandResolvers.forEach((resolver) => {
      resolver('stop')
    })
    this.commandResolvers.clear()
  }

  public addBreakpoint(nodeId: string): void {
    this.state.breakpoints.add(nodeId)
  }

  public removeBreakpoint(nodeId: string): void {
    this.state.breakpoints.delete(nodeId)
  }

  public getState(): DebuggerState {
    return {
      isPaused: this.state.isPaused,
      currentNode: this.state.currentNode,
      breakpoints: new Set(this.state.breakpoints),
      pausedNodes: new Set(this.commandResolvers.keys()),
    }
  }

  async waitForCommand(node: INode): Promise<DebuggerCommand> {
    // If stop was requested, immediately return stop command
    if (this.stopRequested) {
      return 'stop'
    }

    // Set currentNode for informational purposes
    this.state.currentNode = node.id

    // If we're paused or hit a breakpoint, wait for command
    if (this.state.isPaused || this.state.breakpoints.has(node.id)) {
      this.state.isPaused = true

      return new Promise<DebuggerCommand>((resolve) => {
        this.commandResolvers.set(node.id, resolve)

        if (this.onBreakpointHit) {
          this.onBreakpointHit(node)
        }
      })
    }

    // Otherwise continue execution
    return 'continue'
  }
}

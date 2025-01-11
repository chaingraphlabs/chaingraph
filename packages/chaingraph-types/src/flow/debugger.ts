import type { INode } from '@chaingraph/types'
import type { TypedEventEmitter } from '@chaingraph/types/flow/execution-event-emitter'
import type { DebuggerCommand, DebuggerController, DebuggerState } from './debugger-types'
import { ExecutionEventEnum } from '@chaingraph/types/flow/execution-events'

export class FlowDebugger implements DebuggerController {
  private state: DebuggerState = {
    isPaused: false,
    currentNode: null,
    breakpoints: new Set(),
  }

  private commandResolver: ((command: DebuggerCommand) => void) | null = null
  private stopRequested: boolean = false

  private eventEmitter: TypedEventEmitter

  constructor(eventEmitter: TypedEventEmitter) {
    this.eventEmitter = eventEmitter
    this.reset()
  }

  private reset() {
    this.state = {
      isPaused: false,
      currentNode: null,
      breakpoints: new Set(),
    }
    this.stopRequested = false
    this.commandResolver = null
  }

  public pause(): void {
    this.state.isPaused = true
  }

  public continue(): void {
    if (this.commandResolver) {
      this.commandResolver('continue')
      this.commandResolver = null
    }
    this.state.isPaused = false
  }

  public step(): void {
    if (this.commandResolver) {
      this.commandResolver('step')
      this.commandResolver = null
    }
  }

  public stop(): void {
    this.stopRequested = true
    if (this.commandResolver) {
      this.commandResolver('stop')
      this.commandResolver = null
    }
  }

  public addBreakpoint(nodeId: string): void {
    this.state.breakpoints.add(nodeId)
  }

  public removeBreakpoint(nodeId: string): void {
    this.state.breakpoints.delete(nodeId)
  }

  public getState(): DebuggerState {
    return { ...this.state }
  }

  // async waitForCommand(node: INode): Promise<DebuggerCommand> {
  //   this.state.currentNode = node.id
  //
  //   // Always check if we're already stopped
  //   if (this.state.isPaused) {
  //     return new Promise((resolve) => {
  //       this.commandResolver = resolve
  //       this.eventEmitter.emit(ExecutionEventEnum.DEBUG_BREAKPOINT_HIT, { node })
  //     })
  //   }
  //
  //   // If we hit a breakpoint, pause and wait
  //   if (this.state.breakpoints.has(node.id)) {
  //     this.state.isPaused = true
  //     return new Promise((resolve) => {
  //       this.commandResolver = resolve
  //       this.eventEmitter.emit(ExecutionEventEnum.DEBUG_BREAKPOINT_HIT, { node })
  //     })
  //   }
  //
  //   if (this.commandResolver) {
  //     // If there's a pending command resolver, we should wait for it
  //     return new Promise((resolve) => {
  //       this.commandResolver = resolve
  //     })
  //   }
  //
  //   // Create a Promise that resolves immediately with 'continue'
  //   // but can be intercepted by a stop command
  //   return new Promise((resolve) => {
  //     this.commandResolver = resolve
  //     // Immediately resolve with continue if no stop is pending
  //     setImmediate(() => {
  //       if (this.commandResolver === resolve) {
  //         this.commandResolver = null
  //         resolve('continue')
  //       }
  //     })
  //   })
  // }

  async waitForCommand(node: INode): Promise<DebuggerCommand> {
    // If stop was requested, immediately return stop command
    if (this.stopRequested) {
      return 'stop'
    }

    this.state.currentNode = node.id

    // If we're paused or hit a breakpoint, wait for command
    if (this.state.isPaused || this.state.breakpoints.has(node.id)) {
      this.state.isPaused = true

      return new Promise<DebuggerCommand>((resolve) => {
        this.commandResolver = resolve
        this.eventEmitter.emit(ExecutionEventEnum.DEBUG_BREAKPOINT_HIT, { node })
      })
    }

    // Otherwise continue execution
    return 'continue'
  }
}

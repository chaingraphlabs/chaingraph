import type { ExecutionContext } from '@chaingraph/types/flow/execution-context'
import type { EventDataType, ExecutionEvent } from './execution-events'
import { EventEmitter } from 'node:events'
import { ExecutionEventEnum } from './execution-events'

export class TypedEventEmitter {
  private context: ExecutionContext
  private eventEmitter = new EventEmitter()
  private eventIndex = 0

  constructor(context: ExecutionContext) {
    this.context = context
  }

  emit<T extends ExecutionEventEnum>(
    type: T,
    data: EventDataType<T>,
  ): void {
    const event: ExecutionEvent = {
      index: this.eventIndex++,
      type,
      timestamp: new Date(),
      context: this.context,
      data,
    } as ExecutionEvent

    // emit specific event
    this.eventEmitter.emit(type, event)

    if (type !== ExecutionEventEnum.ALL) {
      this.eventEmitter.emit(ExecutionEventEnum.ALL, event)
    }
  }

  on<T extends ExecutionEventEnum>(
    type: T,
    handler: (event: Extract<ExecutionEvent, { type: T }>) => void,
  ): void {
    this.eventEmitter.on(type, handler)
  }

  off<T extends ExecutionEventEnum>(
    type: T,
    handler: (event: Extract<ExecutionEvent, { type: T }>) => void,
  ): void {
    this.eventEmitter.off(type, handler)
  }

  onAll(handler: (event: ExecutionEvent) => void): void {
    this.on(ExecutionEventEnum.ALL, handler)
  }

  offAll(handler: (event: ExecutionEvent) => void): void {
    this.off(ExecutionEventEnum.ALL, handler)
  }

  removeAllListeners(): void {
    this.eventEmitter.removeAllListeners()
  }
}

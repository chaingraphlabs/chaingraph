import { v4 as uuidv4 } from 'uuid'

export class ExecutionContext {
  public readonly executionId: string
  public readonly startTime: Date
  public readonly flowId?: string
  public readonly metadata: Record<string, unknown>
  public readonly abortController: AbortController

  constructor(
    flowId: string,
    abortController: AbortController,
    metadata?: Record<string, unknown>,
    executionId?: string,
  ) {
    this.executionId = executionId || uuidv4()
    this.startTime = new Date()
    this.flowId = flowId
    this.metadata = metadata || {}
    this.abortController = abortController
  }

  get abortSignal(): AbortSignal {
    return this.abortController.signal
  }
}

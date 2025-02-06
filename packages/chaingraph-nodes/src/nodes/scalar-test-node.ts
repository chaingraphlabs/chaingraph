import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Boolean,
  Input,
  Node,
  NodeExecutionStatus,
  Number,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { nodeRegistry } from '../registry'

@Node({
  title: 'Scalar Node',
  description: 'Node with scalar ports',
}, nodeRegistry)
class ScalarNode extends BaseNode {
  @Input()
  @String({
    defaultValue: 'default string',
  })
  strInput: string = 'default string'

  @Input()
  @Number({
    defaultValue: 42,
  })
  numInput: number = 42

  @Input()
  @Boolean({
    defaultValue: true,
  })
  boolInput: boolean = true

  @Output()
  @String()
  strOutput: string = 'output string'

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

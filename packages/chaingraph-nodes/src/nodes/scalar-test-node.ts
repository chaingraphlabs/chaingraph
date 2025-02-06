import { nodeRegistry } from '@chaingraph/nodes/registry'
import {
  BaseNode,
  Boolean,
  type ExecutionContext,
  Input,
  Node,
  type NodeExecutionResult,
  NodeExecutionStatus,
  Number,
  Output,
  String,
} from '@chaingraph/types'

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
  @ Number({
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

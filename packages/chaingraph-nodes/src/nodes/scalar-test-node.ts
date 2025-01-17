import { nodeRegistry } from '@chaingraph/nodes/registry'
import {
  BaseNode,
  type ExecutionContext,
  ExecutionStatus,
  Input,
  Node,
  type NodeExecutionResult,
  Output,
  PortBoolean,
  PortNumber,
  PortString,
} from '@chaingraph/types'

@Node({
  title: 'Scalar Node',
  description: 'Node with scalar ports',
}, nodeRegistry)
class ScalarNode extends BaseNode {
  @Input()
  @PortString({
    defaultValue: 'default string',
  })
  strInput: string = 'default string'

  @Input()
  @PortNumber({
    defaultValue: 42,
  })
  numInput: number = 42

  @Input()
  @PortBoolean({
    defaultValue: true,
  })
  boolInput: boolean = true

  @Output()
  @PortString()
  strOutput: string = 'output string'

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: ExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

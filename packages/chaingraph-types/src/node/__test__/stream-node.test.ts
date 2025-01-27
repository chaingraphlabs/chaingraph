import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import {
  BaseNode,
  Input,
  MultiChannel,
  Node,
  NodeRegistry,
  Output,
  PortKind,
  PortStreamInput,
  PortStreamOutput,
  registerPortTransformers,
} from '@chaingraph/types'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { NodeExecutionStatus } from '@chaingraph/types/node/node-enums'
import superjson from 'superjson'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

@Node({
  title: 'Stream Node',
  description: 'Node with stream ports',
})
class StreamNode extends BaseNode {
  @Input()
  @PortStreamInput({
    defaultValue: new MultiChannel<string>(),
    valueType: {
      kind: PortKind.String,
      defaultValue: '',
    },
  })
  inputStream: MultiChannel<string> = new MultiChannel<string>()

  @Output()
  @PortStreamOutput({
    defaultValue: new MultiChannel<string>(),
    valueType: {
      kind: PortKind.String,
      defaultValue: '',
    },
  })
  outputStream: MultiChannel<string> = new MultiChannel<string>()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('stream node serialization', () => {
  beforeAll(() => {
    registerPortTransformers()
    registerNodeTransformers()
  })

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  it('serializes and deserializes a node with stream ports', async () => {
    const streamNode = new StreamNode('stream-node')
    await streamNode.initialize()

    // const json = superjson.serialize(streamNode)
    // const parsed = superjson.deserialize(json as any as SuperJSONResult)
    //
    // expect(parsed).toBeDefined()
    // expect(parsed).toEqual(streamNode)

    streamNode.outputStream.send('hello')
    streamNode.outputStream.send('world')

    const json2 = superjson.serialize(streamNode)
    const parsed2 = superjson.deserialize(json2 as any as SuperJSONResult) as StreamNode

    expect(parsed2).toBeDefined()
    expect(parsed2.metadata).toEqual(streamNode.metadata)
    expect(parsed2.status).toEqual(streamNode.status)
  })
})

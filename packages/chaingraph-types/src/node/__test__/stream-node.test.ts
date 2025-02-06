import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, Input, Node, Output } from '@chaingraph/types'
import { Port } from '@chaingraph/types/node'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { NodeExecutionStatus } from '@chaingraph/types/node/node-enums'

import { MultiChannel } from '@chaingraph/types/port-new/channel'
import {
  ArrayPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
  StringPortPlugin,
} from '@chaingraph/types/port-new/plugins'
import { portRegistry } from '@chaingraph/types/port-new/registry'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

portRegistry.register(StringPortPlugin)
portRegistry.register(NumberPortPlugin)
portRegistry.register(ArrayPortPlugin)
portRegistry.register(ObjectPortPlugin)
portRegistry.register(StreamPortPlugin)

@Node({
  title: 'Stream Node',
  description: 'Node with stream ports',
})
class StreamNode extends BaseNode {
  @Input()
  @Port({
    type: 'stream',
    // mode: 'input',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  inputStream: MultiChannel<string> = new MultiChannel<string>()

  @Output()
  @Port({
    type: 'stream',
    // mode: 'output',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  outputStream: MultiChannel<string> = new MultiChannel<string>()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Echo input to output
    for await (const data of this.inputStream) {
      this.outputStream.send(data)
    }

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
    // Register all port types
    // registerAllPorts()
    registerNodeTransformers()
  })

  it('serializes and deserializes a node with stream ports', async () => {
    const streamNode = new StreamNode('stream-node')
    await streamNode.initialize()

    // Send some data through the output stream
    streamNode.outputStream.send('hello')
    streamNode.outputStream.send('world')

    const json = superjson.serialize(streamNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult) as StreamNode

    expect(parsed).toBeDefined()
    expect(parsed.metadata).toEqual(streamNode.metadata)
    expect(parsed.status).toEqual(streamNode.status)
  })

  it('maintains stream functionality after deserialization', async () => {
    const streamNode = new StreamNode('stream-node')
    await streamNode.initialize()

    // Serialize and deserialize
    const json = superjson.serialize(streamNode)
    const jsonString = JSON.stringify(json)
    const parsedJson = JSON.parse(jsonString)
    const parsed = superjson.deserialize(parsedJson as any as SuperJSONResult) as StreamNode
    await parsed.initialize()

    // Send data through input stream
    parsed.inputStream.send('test1')
    parsed.inputStream.send('test2')
    parsed.inputStream.close()

    // Execute to process the stream
    await parsed.execute({
      startTime: new Date(),
      flowId: 'test-flow',
      executionId: 'test-execution',
      metadata: {},
      abortController: new AbortController(),
      abortSignal: new AbortController().signal,
    })

    // Collect output stream data
    const receivedData: string[] = []
    for await (const data of parsed.outputStream) {
      receivedData.push(data)
      if (receivedData.length === 2)
        break
    }

    // Verify the data was processed correctly
    expect(receivedData).toEqual(['test1', 'test2'])
  })
})

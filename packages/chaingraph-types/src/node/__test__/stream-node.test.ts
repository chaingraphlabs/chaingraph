/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeExecutionResult } from '../types'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import { Input, Node, Output, Port } from '../../decorator'
import { ExecutionContext } from '../../execution'
import {
  ArrayPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  PortPluginRegistry,
  StreamPortPlugin,
  StringPortPlugin,
} from '../../port'
import { MultiChannel } from '../../utils'
import { BaseNode } from '../base-node'
import { registerNodeTransformers } from '../json-transformers'
import 'reflect-metadata'

PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)
PortPluginRegistry.getInstance().register(StreamPortPlugin)

@Node({
  type: 'StreamNode',
  title: 'Stream Node',
  description: 'Node with stream ports',
})
class StreamNode extends BaseNode {
  @Input()
  @Port({
    type: 'stream' as const,
    // mode: 'input',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  inputStream: MultiChannel<string> = new MultiChannel<string>()

  @Output()
  @Port({
    type: 'stream' as const,
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

    return {}
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
    const parsed = superjson.deserialize(json) as StreamNode

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
    const parsed = superjson.deserialize(parsedJson) as StreamNode
    await parsed.initialize()

    // Send data through input stream
    parsed.inputStream.send('test1')
    parsed.inputStream.send('test2')
    parsed.inputStream.close()

    // Execute to process the stream
    await parsed.execute(new ExecutionContext(
      'test-flow',
      new AbortController(),
    ))

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

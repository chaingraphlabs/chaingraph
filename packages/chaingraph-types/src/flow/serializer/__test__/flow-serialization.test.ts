/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../../execution'
import type { NodeExecutionResult } from '../../../node'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { util } from 'zod'
import {
  Node,
  NodeRegistry,
  ObjectSchema,
  Passthrough,
  PortArray,
  PortBoolean,
  PortEnum,
  PortNumber,
  PortObject,
  PortString,
} from '../../../decorator'
import { BaseNode, registerNodeTransformers } from '../../../node'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  PortPluginRegistry,
  StreamPortPlugin,
  StringPortPlugin,
} from '../../../port'
import { Flow } from '../../flow'
import { registerFlowTransformers } from '../../json-transformers'
import { FlowSerializer } from '../flow-serializer'
import find = util.find

// Define Participant schema
@ObjectSchema({
  description: 'Represents a participant in a chat conversation',
})
class Participant {
  @PortString({
    title: 'Participant ID',
    description: 'Unique identifier for the participant',
    minLength: 1,
    required: true,
  })
  participant_id: string = ''

  @PortString({
    title: 'Username',
    description: 'Username of the participant',
    minLength: 1,
    required: true,
  })
  username: string = ''

  @PortString({
    title: 'First Name',
    description: 'First name of the participant',
    minLength: 1,
    required: true,
  })
  first_name: string = ''

  @PortString({
    title: 'Agent ID',
    description: 'ID of the agent if participant is an agent',
    minLength: 1,
    required: true,
  })
  agent_id: string = ''

  @PortBoolean({
    title: 'Is Agent',
    description: 'Whether this participant is an agent',
    defaultValue: false,
    required: true,
  })
  is_agent: boolean = false

  @PortString({
    title: 'Avatar',
    description: 'URL to participant avatar image',
    minLength: 1,
  })
  avatar: string = ''

  @PortString({
    title: 'Last Name',
    description: 'Last name of the participant',
  })
  last_name?: string

  @PortString({
    title: 'Metadata',
    description: 'Additional JSON metadata for the participant',
    defaultValue: '{}',
    ui: {
      isTextArea: true,
    },
  })
  meta: string = '{}'
}

// Define Attachment schema
@ObjectSchema({
  description: 'Represents a file attachment in a message',
})
class Attachment {
  @PortString({
    title: 'Attachment ID',
    description: 'Unique identifier for the attachment',
    minLength: 1,
    required: true,
  })
  id: string = ''

  @PortString({
    title: 'Filename',
    description: 'Name of the attached file',
    minLength: 1,
    required: true,
  })
  filename: string = ''

  @PortString({
    title: 'URL',
    description: 'URL to download the attachment',
    minLength: 1,
    required: true,
  })
  url: string = ''

  @PortString({
    title: 'MIME Type',
    description: 'Media type of the attached file',
    minLength: 1,
  })
  mime_type: string = ''

  @PortNumber({
    title: 'Size',
    description: 'Size of the attachment in bytes',
    min: 0,
    integer: true,
    defaultValue: 0,
  })
  size: number = 0
}

// Define Message schema
@ObjectSchema({
  description: 'Represents a message in a chat conversation',
})
class Message {
  @PortNumber({
    title: 'Message ID',
    description: 'Unique identifier for the message',
    required: true,
  })
  message_id: number = 0

  @PortString({
    title: 'Chat ID',
    description: 'ID of the chat this message belongs to',
    minLength: 1,
    required: true,
  })
  chat_id: string = ''

  @PortString({
    title: 'Text',
    description: 'Content of the message',
    ui: {
      isTextArea: true,
      textareaDimensions: { height: 100 },
    },
    required: true,
  })
  text: string = ''

  @PortString({
    title: 'Author ID',
    description: 'ID of the participant who sent the message',
    minLength: 1,
    required: true,
  })
  author_id: string = ''

  @PortEnum({
    title: 'Message Type',
    description: 'Type of message (common, system, error, etc.)',
    options: [
      { id: 'agentTrigger', type: 'string', defaultValue: 'agentTrigger', title: 'Agent Trigger' },
      { id: 'common', type: 'string', defaultValue: 'common', title: 'Common' },
      { id: 'error', type: 'string', defaultValue: 'error', title: 'Error' },
      { id: 'scratchpad', type: 'string', defaultValue: 'scratchpad', title: 'Scratchpad' },
      { id: 'system', type: 'string', defaultValue: 'system', title: 'System' },
      { id: 'telegram', type: 'string', defaultValue: 'telegram', title: 'Telegram' },
      { id: 'thoughts', type: 'string', defaultValue: 'thoughts', title: 'Thoughts' },
      { id: 'twitter', type: 'string', defaultValue: 'twitter', title: 'Twitter' },
    ],
    defaultValue: 'common',
    required: true,
  })
  type: string = 'common'

  @PortString({
    title: 'Timestamp',
    description: 'Time when the message was sent',
    minLength: 1,
    required: true,
  })
  time: string = ''

  @PortObject({
    schema: Participant,
    title: 'Participant',
    description: 'Information about the message author',
  })
  participant?: Participant

  @PortArray({
    title: 'Attachments',
    description: 'Files attached to this message',
    itemConfig: {
      type: 'object',
      schema: Attachment,
      defaultValue: new Attachment(),
    },
    defaultValue: [],
  })
  attachments: Attachment[] = []

  @PortBoolean({
    title: 'Finished',
    description: 'Whether this message has been completed',
    defaultValue: true,
    required: true,
  })
  finished: boolean = true

  @PortBoolean({
    title: 'System Message',
    description: 'Whether this is a system message',
    defaultValue: false,
    required: true,
  })
  is_system: boolean = false

  @PortBoolean({
    title: 'Needs Answer',
    description: 'Whether this message requires a response',
    defaultValue: false,
    required: true,
  })
  need_answer: boolean = false

  @PortNumber({
    title: 'Version',
    description: 'Message schema version',
    min: 1,
    integer: true,
    defaultValue: 1,
    required: true,
  })
  version: number = 1

  @PortNumber({
    title: 'Reply To',
    description: 'ID of the message this is replying to',
    defaultValue: 0,
    required: false,
  })
  reply_to: number = 0

  @PortString({
    title: 'Error',
    description: 'Error message if something went wrong',
    required: true,
  })
  error: string = ''

  @PortString({
    title: 'Metadata',
    description: 'Additional JSON metadata for the message',
    defaultValue: '{}',
    ui: {
      isTextArea: true,
    },
  })
  meta: string = '{}'
}

@Node({
  type: 'OnNewMessageTestEventNode',
  title: 'On New Message Test Event',
  description: 'Triggered when a new message is received in the chat',
  tags: ['message', 'event', 'new'],
})
class OnNewMessageTestEventNode extends BaseNode {
  @Passthrough()
  @PortObject({
    schema: Message,
    title: 'Message',
    description: 'The received message data from chat',
    ui: {
      hidePropertyEditor: true,
    },
  })
  message?: Message

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)
PortPluginRegistry.getInstance().register(EnumPortPlugin)
PortPluginRegistry.getInstance().register(StreamPortPlugin)

describe('flow Serialization', () => {
  beforeAll(() => {
    // Register all necessary transformers
    // registerPortTransformers()
    registerNodeTransformers()
    registerFlowTransformers()
  })

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  it('should correctly serialize and deserialize a simple flow', async () => {
    // Create a flow
    const flow = new Flow({
      name: 'Test Flow',
      description: 'A test flow for serialization',
    })

    // Create nodes
    const testNode = new OnNewMessageTestEventNode('test-node-1')
    const testNode2 = new OnNewMessageTestEventNode('test-node-2')

    // Initialize nodes
    testNode.initialize()
    testNode2.initialize()

    // Add nodes to flow
    await flow.addNode(testNode)
    await flow.addNode(testNode2)

    testNode.message = new Message()
    testNode.message.message_id = 1
    testNode.message.chat_id = 'chat-123'
    testNode.message.text = 'Hello, world!'
    testNode.message.author_id = 'user-456'
    testNode.message.type = 'common'
    testNode.message.time = new Date().toISOString()
    testNode.message.participant = new Participant()
    testNode.message.participant.participant_id = 'user-456'
    testNode.message.participant.username = 'johndoe'
    testNode.message.participant.first_name = 'John'
    testNode.message.participant.last_name = 'Doe'
    testNode.message.participant.is_agent = false
    testNode.message.attachments = []
    testNode.message.finished = true
    testNode.message.is_system = false
    testNode.message.need_answer = true
    testNode.message.version = 1
    testNode.message.error = ''
    testNode.message.meta = JSON.stringify({ custom: 'data' })

    await flow.connectPorts(
      testNode.id,
      testNode.findPort(port => port.key === 'message_id')?.id || '',
      testNode2.id,
      testNode2.findPort(port => port.key === 'message_id')?.id || '',
    )

    const serializer = new FlowSerializer()
    const serializedNode = serializer.serializeNode(testNode)
    const deserializedNode = serializer.deserializeNode<OnNewMessageTestEventNode>(serializedNode)

    // Assertions
    // Check that the deserialized node matches the original
    expect(deserializedNode).toBeDefined()
    expect(deserializedNode.id).toBe(testNode.id)
    expect(deserializedNode.metadata).toStrictEqual(testNode.metadata)
    expect(deserializedNode.status).toBe(testNode.status)
    expect((deserializedNode as any).message).toEqual(testNode.message)

    // check that all the ports are the same, iterate over the ports and compare values
    for (const portKey of Object.keys(testNode.ports)) {
      const originalPort = testNode.ports[portKey]
      const deserializedPort = deserializedNode.ports[portKey]

      expect(deserializedPort).toBeDefined()
      if (!deserializedPort)
        continue

      expect(deserializedPort.id).toBe(originalPort.id)
      expect(deserializedPort.key).toBe(originalPort.key)
      expect(deserializedPort.type).toBe(originalPort.type)
      expect(deserializedPort.title).toBe(originalPort.title)
      expect(deserializedPort.description).toBe(originalPort.description)
      expect(deserializedPort.required).toBe(originalPort.required)
      expect(deserializedPort.readonly).toBe(originalPort.readonly)
      expect(deserializedPort.hidden).toBe(originalPort.hidden)
      expect(deserializedPort.ui).toEqual(originalPort.ui)
      expect(deserializedPort.metadata).toEqual(originalPort.metadata)
      expect(deserializedPort.value).toEqual(originalPort.value)
    }

    // check if connection are exists:
    const messageIdPort = deserializedNode.findPort(port => port.key === 'message_id')
    expect(messageIdPort).toBeDefined()

    const messageIdPortConnections = messageIdPort!.getConfig().connections
    expect(messageIdPortConnections).toBeDefined()
    expect(messageIdPortConnections?.length).toBe(1)

    messageIdPortConnections!.forEach((connection) => {
      expect(connection.nodeId).toBe(testNode2.id)
      expect(connection.portId).toBe(testNode2.findPort(port => port.key === 'message_id')?.id || '')
    })
  })
})

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  ObjectSchema,
  PortArray,
  PortBoolean,
  PortEnum,
  PortNumber,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'

// Define Participant schema
@ObjectSchema({
  description: 'Represents a participant in a chat conversation',
  type: 'Participant',
})
export class Participant {
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
  type: 'Attachment',
})
export class Attachment {
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
  type: 'Message',
})
export class Message {
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

// Define ChatMeta schema
@ObjectSchema({
  description: 'Represents a chat room or conversation',
  type: 'ChatMeta',
})
export class ChatMeta {
  @PortString({
    title: 'Chat ID',
    description: 'Unique identifier for the chat room',
    minLength: 1,
    required: true,
  })
  id: string = ''

  @PortString({
    title: 'Name',
    description: 'Name of the chat room',
    minLength: 1,
    required: true,
  })
  name: string = ''

  @PortString({
    title: 'Author',
    description: 'ID of the participant who created the chat room',
    minLength: 1,
    required: true,
  })
  author: string = ''

  @PortString({
    title: 'Created At',
    description: 'Timestamp when the chat room was created',
    minLength: 1,
    required: true,
  })
  created_at: string = ''

  @PortString({
    title: 'Updated At',
    description: 'Timestamp when the chat room was last updated',
    minLength: 1,
    required: true,
  })
  updated_at: string = ''

  @PortString({
    title: 'Metadata',
    description: 'Additional JSON metadata for the chat room',
    defaultValue: '{}',
    ui: {
      isTextArea: true,
    },
  })
  meta: string = '{}'

  @PortArray({
    title: 'Participants',
    description: 'List of participants in the chat room',
    itemConfig: {
      type: 'object',
      schema: Participant,
      defaultValue: new Participant(),
    },
    defaultValue: [],
    required: true,
  })
  participants: Participant[] = []

  @PortObject({
    schema: Message,
    title: 'Last Message',
    description: 'The last message sent in the chat room',
    defaultValue: new Message(),
  })
  last_message?: Message

  @PortString({
    title: 'Last Message Time',
    description: 'Timestamp of the last message in the chat room',
  })
  last_message_time?: string
}

/**
 * Enum for variable namespaces in BadAI
 */
export enum VariableNamespace {
  Execution = 'execution',
  Agent = 'agent',
  Chat = 'chat',
  ChatAgent = 'chat_agent',
}

/**
 * Enum for variable value types in BadAI
 */
export enum VariableValueType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object',
  Array = 'array',
  Any = 'any',
}

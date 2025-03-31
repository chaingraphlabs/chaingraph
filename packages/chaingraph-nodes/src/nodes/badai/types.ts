/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  Boolean,
  Number,
  ObjectSchema,
  PortArray,
  PortEnum,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'

// Define Participant schema
@ObjectSchema({
  description: 'Represents a participant in a chat conversation',
})
export class Participant {
  @String({
    title: 'Participant ID',
    description: 'Unique identifier for the participant',
    minLength: 1,
  })
  participant_id: string = ''

  @String({
    title: 'Username',
    description: 'Username of the participant',
    minLength: 1,
  })
  username: string = ''

  @String({
    title: 'First Name',
    description: 'First name of the participant',
    minLength: 1,
  })
  first_name: string = ''

  @String({
    title: 'Agent ID',
    description: 'ID of the agent if participant is an agent',
    minLength: 1,
  })
  agent_id: string = ''

  @Boolean({
    title: 'Is Agent',
    description: 'Whether this participant is an agent',
    defaultValue: false,
  })
  is_agent: boolean = false

  @String({
    title: 'Avatar',
    description: 'URL to participant avatar image',
    minLength: 1,
  })
  avatar: string = ''

  @String({
    title: 'Last Name',
    description: 'Last name of the participant',
  })
  last_name?: string

  @String({
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
export class Attachment {
  @String({
    title: 'Attachment ID',
    description: 'Unique identifier for the attachment',
    minLength: 1,
  })
  id: string = ''

  @String({
    title: 'Filename',
    description: 'Name of the attached file',
    minLength: 1,
  })
  filename: string = ''

  @String({
    title: 'URL',
    description: 'URL to download the attachment',
    minLength: 1,
  })
  url: string = ''

  @String({
    title: 'MIME Type',
    description: 'Media type of the attached file',
    minLength: 1,
  })
  mime_type: string = ''

  @Number({
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
export class Message {
  @Number({
    title: 'Message ID',
    description: 'Unique identifier for the message',
  })
  message_id: number = 0

  @String({
    title: 'Chat ID',
    description: 'ID of the chat this message belongs to',
    minLength: 1,
  })
  chat_id: string = ''

  @String({
    title: 'Text',
    description: 'Content of the message',
    minLength: 0,
    ui: {
      isTextArea: true,
      textareaDimensions: { height: 100 },
    },
  })
  text: string = ''

  @String({
    title: 'Author ID',
    description: 'ID of the participant who sent the message',
    minLength: 1,
  })
  author_id: string = ''

  @PortEnum({
    title: 'Message Type',
    description: 'Type of message (common, system, error, etc.)',
    options: [
      { id: 'common', type: 'string', defaultValue: 'common', title: 'Common' },
      { id: 'error', type: 'string', defaultValue: 'error', title: 'Error' },
      { id: 'scratchpad', type: 'string', defaultValue: 'scratchpad', title: 'Scratchpad' },
      { id: 'system', type: 'string', defaultValue: 'system', title: 'System' },
      { id: 'telegram', type: 'string', defaultValue: 'telegram', title: 'Telegram' },
      { id: 'thoughts', type: 'string', defaultValue: 'thoughts', title: 'Thoughts' },
      { id: 'twitter', type: 'string', defaultValue: 'twitter', title: 'Twitter' },
    ],
    defaultValue: 'common',
  })
  type: string = 'common'

  @String({
    title: 'Timestamp',
    description: 'Time when the message was sent',
    minLength: 1,
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
    },
    defaultValue: [],
  })
  attachments: Attachment[] = []

  @Boolean({
    title: 'Finished',
    description: 'Whether this message has been completed',
    defaultValue: true,
  })
  finished: boolean = true

  @Boolean({
    title: 'System Message',
    description: 'Whether this is a system message',
    defaultValue: false,
  })
  is_system: boolean = false

  @Boolean({
    title: 'Needs Answer',
    description: 'Whether this message requires a response',
    defaultValue: false,
  })
  need_answer: boolean = false

  @Number({
    title: 'Version',
    description: 'Message schema version',
    min: 1,
    integer: true,
    defaultValue: 1,
  })
  version: number = 1

  @Number({
    title: 'Reply To',
    description: 'ID of the message this is replying to',
  })
  reply_to?: number

  @String({
    title: 'Error',
    description: 'Error message if something went wrong',
  })
  error?: string

  @String({
    title: 'Metadata',
    description: 'Additional JSON metadata for the message',
    defaultValue: '{}',
    ui: {
      isTextArea: true,
    },
  })
  meta: string = '{}'
}

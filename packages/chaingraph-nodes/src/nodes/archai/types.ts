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
 * Enum for variable namespaces in ArchAI
 */
export enum VariableNamespace {
  Execution = 'execution',
  Agent = 'agent',
  Chat = 'chat',
  ChatAgent = 'chat_agent',
}

/**
 * Enum for variable value types in ArchAI
 */
export enum VariableValueType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object',
  Array = 'array',
  Any = 'any',
}

// Define DocumentMetadataKV schema
@ObjectSchema({
  description: 'Represents a key-value pair for document metadata',
})
export class DocumentMetadataKV {
  @PortString({
    title: 'Key',
    description: 'Metadata key',
    required: true,
  })
  key: string = ''

  @PortString({
    title: 'Value',
    description: 'Metadata value',
    required: true,
  })
  value: string = ''
}

// Define DocumentIndexingState schema
@ObjectSchema({
  description: 'Represents the indexing state of a document',
})
export class DocumentIndexingState {
  @PortBoolean({
    title: 'Is Indexing',
    description: 'Whether the document is currently being indexed',
    required: true,
  })
  is_indexing: boolean = false

  @PortBoolean({
    title: 'Is Indexing Accepted',
    description: 'Whether the indexing request has been accepted',
    required: true,
  })
  is_indexing_accepted: boolean = false

  @PortBoolean({
    title: 'Is Indexing Failed',
    description: 'Whether the indexing process has failed',
    required: true,
  })
  is_indexing_failed: boolean = false

  @PortBoolean({
    title: 'Is Indexing Finished',
    description: 'Whether the indexing process has completed',
    required: true,
  })
  is_indexing_finished: boolean = false

  @PortBoolean({
    title: 'Is Indexing Paused',
    description: 'Whether the indexing process is paused',
    required: true,
  })
  is_indexing_paused: boolean = false

  @PortString({
    title: 'Failed Reason',
    description: 'Reason for indexing failure, if any',
  })
  failed_reason?: string
}

// Define IndexingState schema
@ObjectSchema({
  description: 'Represents the indexing state of a document or chunk',
})
export class IndexingState {
  @PortBoolean({
    title: 'Is Embedded',
    description: 'Whether the content has been embedded',
    required: true,
  })
  is_embedded: boolean = false

  @PortBoolean({
    title: 'Is Indexed QA',
    description: 'Whether QA pairs have been indexed',
    required: true,
  })
  is_indexed_qa: boolean = false

  @PortBoolean({
    title: 'Is Indexed Triplet',
    description: 'Whether triplets have been indexed',
    required: true,
  })
  is_indexed_triplet: boolean = false

  @PortBoolean({
    title: 'Is Parsed',
    description: 'Whether the content has been parsed',
    required: true,
  })
  is_parsed: boolean = false

  @PortBoolean({
    title: 'Is Summarized',
    description: 'Whether the content has been summarized',
    required: true,
  })
  is_summarized: boolean = false

  @PortNumber({
    title: 'Completion Cost',
    description: 'Cost of completion in tokens',
    required: true,
  })
  completion_cost: number = 0

  @PortNumber({
    title: 'Completion Tokens',
    description: 'Number of completion tokens',
    required: true,
  })
  completion_tokens: number = 0

  @PortNumber({
    title: 'Content Tokens',
    description: 'Number of content tokens',
    required: true,
  })
  content_tokens: number = 0

  @PortNumber({
    title: 'Embedding Cost',
    description: 'Cost of embedding in tokens',
    required: true,
  })
  embedding_cost: number = 0

  @PortNumber({
    title: 'Prompt Cost',
    description: 'Cost of prompt in tokens',
    required: true,
  })
  prompt_cost: number = 0

  @PortNumber({
    title: 'Prompt Tokens',
    description: 'Number of prompt tokens',
    required: true,
  })
  prompt_tokens: number = 0
}

// Define DocumentMeta schema
@ObjectSchema({
  description: 'Represents metadata for a document',
})
export class DocumentMeta {
  @PortString({
    title: 'Collection ID',
    description: 'ID of the collection this document belongs to',
    required: true,
  })
  collection_id: string = ''

  @PortString({
    title: 'Created At',
    description: 'Timestamp when the document was created',
    required: true,
  })
  created_at: string = ''

  @PortString({
    title: 'Document ID',
    description: 'Unique identifier for the document',
    required: true,
  })
  document_id: string = ''

  @PortObject({
    schema: DocumentIndexingState,
    title: 'Document Indexing State',
    description: 'Current indexing state of the document',
    required: true,
  })
  document_indexing_state: DocumentIndexingState = new DocumentIndexingState()

  @PortObject({
    schema: IndexingState,
    title: 'Indexing State',
    description: 'Indexing state details',
    required: true,
  })
  indexing_state: IndexingState = new IndexingState()

  @PortArray({
    title: 'Metadata',
    description: 'Additional metadata for the document',
    itemConfig: {
      type: 'object',
      schema: DocumentMetadataKV,
      defaultValue: new DocumentMetadataKV(),
    },
    defaultValue: [],
    required: true,
  })
  metadata: DocumentMetadataKV[] = []

  @PortString({
    title: 'Published At',
    description: 'Timestamp when the document was published',
    required: true,
  })
  published_at: string = ''

  @PortArray({
    title: 'Tags',
    description: 'Tags associated with the document',
    itemConfig: {
      type: 'string',
    },
    defaultValue: [],
    required: true,
  })
  tags: string[] = []

  @PortString({
    title: 'Description',
    description: 'Description of the document',
  })
  description?: string

  @PortString({
    title: 'Name',
    description: 'Name of the document',
  })
  name?: string

  @PortString({
    title: 'URL',
    description: 'URL to access the document',
  })
  url?: string
}

// Define QA schema
@ObjectSchema({
  description: 'Represents a question-answer pair',
})
export class QA {
  @PortString({
    title: 'Answer',
    description: 'Answer to the question',
    required: true,
  })
  answer: string = ''

  @PortNumber({
    title: 'Answer Tokens',
    description: 'Number of tokens in the answer',
    required: true,
  })
  answer_tokens: number = 0

  @PortString({
    title: 'Chunk ID',
    description: 'ID of the chunk this QA pair belongs to',
    required: true,
  })
  chunk_id: string = ''

  @PortNumber({
    title: 'Chunk Number',
    description: 'Number of the chunk',
    required: true,
  })
  chunk_number: number = 0

  @PortString({
    title: 'Created At',
    description: 'Timestamp when the QA pair was created',
    required: true,
  })
  created_at: string = ''

  @PortString({
    title: 'Document ID',
    description: 'ID of the document this QA pair belongs to',
    required: true,
  })
  document_id: string = ''

  @PortString({
    title: 'Document Published At',
    description: 'Timestamp when the document was published',
    required: true,
  })
  document_published_at: string = ''

  // @PortObject({
  //   schema: IndexingState,
  //   title: 'Indexing State',
  //   description: 'Indexing state of the QA pair',
  //   required: true,
  // })
  // indexing_state: IndexingState = new IndexingState()

  @PortNumber({
    title: 'Page Number From',
    description: 'Starting page number for this QA pair',
    required: true,
  })
  page_number_from: number = 0

  @PortNumber({
    title: 'Page Number To',
    description: 'Ending page number for this QA pair',
    required: true,
  })
  page_number_to: number = 0

  @PortString({
    title: 'QA ID',
    description: 'Unique identifier for the QA pair',
    required: true,
  })
  qa_id: string = ''

  @PortString({
    title: 'Question',
    description: 'Question text',
    required: true,
  })
  question: string = ''

  @PortNumber({
    title: 'Question Tokens',
    description: 'Number of tokens in the question',
    required: true,
  })
  question_tokens: number = 0

  @PortString({
    title: 'Task ID',
    description: 'ID of the task that generated this QA pair',
    required: true,
  })
  task_id: string = ''

  @PortString({
    title: 'Model',
    description: 'Model used to generate the QA pair',
  })
  model?: string
}

// Define QAWithSimilarity schema
@ObjectSchema({
  description: 'Represents a QA pair with similarity score',
})
export class QAWithSimilarity {
  @PortObject({
    schema: QA,
    title: 'QA',
    description: 'Question-answer pair',
    required: true,
  })
  qa: QA = new QA()

  @PortNumber({
    title: 'Similarity',
    description: 'Similarity score between the query and the QA pair',
    required: true,
  })
  similarity: number = 0
}

// Define QAWithSimilarityByDocuments schema
@ObjectSchema({
  description: 'Represents QA pairs with similarity scores grouped by document',
})
export class QAWithSimilarityByDocuments {
  @PortObject({
    schema: DocumentMeta,
    title: 'Document',
    description: 'Document metadata',
    required: true,
  })
  document: DocumentMeta = new DocumentMeta()

  @PortArray({
    title: 'QAs',
    description: 'Question-answer pairs with similarity scores',
    itemConfig: {
      type: 'object',
      schema: QAWithSimilarity,
      defaultValue: new QAWithSimilarity(),
    },
    defaultValue: [],
    required: true,
  })
  qas: QAWithSimilarity[] = []
}

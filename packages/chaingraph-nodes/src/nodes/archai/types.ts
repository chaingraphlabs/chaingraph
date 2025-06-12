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
    required: true,
  })
  participant_id: string = ''

  @String({
    title: 'Username',
    description: 'Username of the participant',
    minLength: 1,
    required: true,
  })
  username: string = ''

  @String({
    title: 'First Name',
    description: 'First name of the participant',
    minLength: 1,
    required: true,
  })
  first_name: string = ''

  @String({
    title: 'Agent ID',
    description: 'ID of the agent if participant is an agent',
    minLength: 1,
    required: true,
  })
  agent_id: string = ''

  @Boolean({
    title: 'Is Agent',
    description: 'Whether this participant is an agent',
    defaultValue: false,
    required: true,
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
    required: true,
  })
  id: string = ''

  @String({
    title: 'Filename',
    description: 'Name of the attached file',
    minLength: 1,
    required: true,
  })
  filename: string = ''

  @String({
    title: 'URL',
    description: 'URL to download the attachment',
    minLength: 1,
    required: true,
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
    required: true,
  })
  message_id: number = 0

  @String({
    title: 'Chat ID',
    description: 'ID of the chat this message belongs to',
    minLength: 1,
    required: true,
  })
  chat_id: string = ''

  @String({
    title: 'Text',
    description: 'Content of the message',
    ui: {
      isTextArea: true,
      textareaDimensions: { height: 100 },
    },
    required: true,
  })
  text: string = ''

  @String({
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

  @String({
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

  @Boolean({
    title: 'Finished',
    description: 'Whether this message has been completed',
    defaultValue: true,
    required: true,
  })
  finished: boolean = true

  @Boolean({
    title: 'System Message',
    description: 'Whether this is a system message',
    defaultValue: false,
    required: true,
  })
  is_system: boolean = false

  @Boolean({
    title: 'Needs Answer',
    description: 'Whether this message requires a response',
    defaultValue: false,
    required: true,
  })
  need_answer: boolean = false

  @Number({
    title: 'Version',
    description: 'Message schema version',
    min: 1,
    integer: true,
    defaultValue: 1,
    required: true,
  })
  version: number = 1

  @Number({
    title: 'Reply To',
    description: 'ID of the message this is replying to',
    defaultValue: 0,
    required: false,
  })
  reply_to: number = 0

  @String({
    title: 'Error',
    description: 'Error message if something went wrong',
    required: true,
  })
  error: string = ''

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

// Define ChatMeta schema
@ObjectSchema({
  description: 'Represents a chat room or conversation',
})
export class ChatMeta {
  @String({
    title: 'Chat ID',
    description: 'Unique identifier for the chat room',
    minLength: 1,
    required: true,
  })
  id: string = ''

  @String({
    title: 'Name',
    description: 'Name of the chat room',
    minLength: 1,
    required: true,
  })
  name: string = ''

  @String({
    title: 'Author',
    description: 'ID of the participant who created the chat room',
    minLength: 1,
    required: true,
  })
  author: string = ''

  @String({
    title: 'Created At',
    description: 'Timestamp when the chat room was created',
    minLength: 1,
    required: true,
  })
  created_at: string = ''

  @String({
    title: 'Updated At',
    description: 'Timestamp when the chat room was last updated',
    minLength: 1,
    required: true,
  })
  updated_at: string = ''

  @String({
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

  @String({
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
  @String({
    title: 'Key',
    description: 'Metadata key',
    required: true,
  })
  key: string = ''

  @String({
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
  @Boolean({
    title: 'Is Indexing',
    description: 'Whether the document is currently being indexed',
    required: true,
  })
  is_indexing: boolean = false

  @Boolean({
    title: 'Is Indexing Accepted',
    description: 'Whether the indexing request has been accepted',
    required: true,
  })
  is_indexing_accepted: boolean = false

  @Boolean({
    title: 'Is Indexing Failed',
    description: 'Whether the indexing process has failed',
    required: true,
  })
  is_indexing_failed: boolean = false

  @Boolean({
    title: 'Is Indexing Finished',
    description: 'Whether the indexing process has completed',
    required: true,
  })
  is_indexing_finished: boolean = false

  @Boolean({
    title: 'Is Indexing Paused',
    description: 'Whether the indexing process is paused',
    required: true,
  })
  is_indexing_paused: boolean = false

  @String({
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
  @Boolean({
    title: 'Is Embedded',
    description: 'Whether the content has been embedded',
    required: true,
  })
  is_embedded: boolean = false

  @Boolean({
    title: 'Is Indexed QA',
    description: 'Whether QA pairs have been indexed',
    required: true,
  })
  is_indexed_qa: boolean = false

  @Boolean({
    title: 'Is Indexed Triplet',
    description: 'Whether triplets have been indexed',
    required: true,
  })
  is_indexed_triplet: boolean = false

  @Boolean({
    title: 'Is Parsed',
    description: 'Whether the content has been parsed',
    required: true,
  })
  is_parsed: boolean = false

  @Boolean({
    title: 'Is Summarized',
    description: 'Whether the content has been summarized',
    required: true,
  })
  is_summarized: boolean = false

  @Number({
    title: 'Completion Cost',
    description: 'Cost of completion in tokens',
    required: true,
  })
  completion_cost: number = 0

  @Number({
    title: 'Completion Tokens',
    description: 'Number of completion tokens',
    required: true,
  })
  completion_tokens: number = 0

  @Number({
    title: 'Content Tokens',
    description: 'Number of content tokens',
    required: true,
  })
  content_tokens: number = 0

  @Number({
    title: 'Embedding Cost',
    description: 'Cost of embedding in tokens',
    required: true,
  })
  embedding_cost: number = 0

  @Number({
    title: 'Prompt Cost',
    description: 'Cost of prompt in tokens',
    required: true,
  })
  prompt_cost: number = 0

  @Number({
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
  @String({
    title: 'Collection ID',
    description: 'ID of the collection this document belongs to',
    required: true,
  })
  collection_id: string = ''

  @String({
    title: 'Created At',
    description: 'Timestamp when the document was created',
    required: true,
  })
  created_at: string = ''

  @String({
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

  @String({
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

  @String({
    title: 'Description',
    description: 'Description of the document',
  })
  description?: string

  @String({
    title: 'Name',
    description: 'Name of the document',
  })
  name?: string

  @String({
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
  @String({
    title: 'Answer',
    description: 'Answer to the question',
    required: true,
  })
  answer: string = ''

  @Number({
    title: 'Answer Tokens',
    description: 'Number of tokens in the answer',
    required: true,
  })
  answer_tokens: number = 0

  @String({
    title: 'Chunk ID',
    description: 'ID of the chunk this QA pair belongs to',
    required: true,
  })
  chunk_id: string = ''

  @Number({
    title: 'Chunk Number',
    description: 'Number of the chunk',
    required: true,
  })
  chunk_number: number = 0

  @String({
    title: 'Created At',
    description: 'Timestamp when the QA pair was created',
    required: true,
  })
  created_at: string = ''

  @String({
    title: 'Document ID',
    description: 'ID of the document this QA pair belongs to',
    required: true,
  })
  document_id: string = ''

  @String({
    title: 'Document Published At',
    description: 'Timestamp when the document was published',
    required: true,
  })
  document_published_at: string = ''

  @PortObject({
    schema: IndexingState,
    title: 'Indexing State',
    description: 'Indexing state of the QA pair',
    required: true,
  })
  indexing_state: IndexingState = new IndexingState()

  @Number({
    title: 'Page Number From',
    description: 'Starting page number for this QA pair',
    required: true,
  })
  page_number_from: number = 0

  @Number({
    title: 'Page Number To',
    description: 'Ending page number for this QA pair',
    required: true,
  })
  page_number_to: number = 0

  @String({
    title: 'QA ID',
    description: 'Unique identifier for the QA pair',
    required: true,
  })
  qa_id: string = ''

  @String({
    title: 'Question',
    description: 'Question text',
    required: true,
  })
  question: string = ''

  @Number({
    title: 'Question Tokens',
    description: 'Number of tokens in the question',
    required: true,
  })
  question_tokens: number = 0

  @String({
    title: 'Task ID',
    description: 'ID of the task that generated this QA pair',
    required: true,
  })
  task_id: string = ''

  @String({
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

  @Number({
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

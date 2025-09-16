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
  Local = 'local',
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

// Define Page schema
@ObjectSchema({
  description: 'Represents a page from a document in the knowledge database',
})
export class Page {
  @PortString({
    title: 'Content',
    description: 'Text content of the page',
    required: true,
    ui: {
      isTextArea: true,
    },
  })
  content: string = ''

  @PortString({
    title: 'Created At',
    description: 'Timestamp when the page was created',
    required: true,
  })
  created_at: string = ''

  @PortString({
    title: 'Description',
    description: 'Description of the page',
  })
  description?: string

  @PortString({
    title: 'Document ID',
    description: 'ID of the document this page belongs to',
    required: true,
  })
  document_id: string = ''

  @PortNumber({
    title: 'Number',
    description: 'Page number within the document',
    required: true,
    integer: true,
  })
  number: number = 0

  @PortString({
    title: 'Page ID',
    description: 'Unique identifier for the page',
    required: true,
  })
  page_id: string = ''

  @PortString({
    title: 'Task ID',
    description: 'ID of the task that processed this page',
    required: true,
  })
  task_id: string = ''
}

// Define IndexingDocumentStatisticsLLM schema
@ObjectSchema({
  description: 'Represents LLM statistics for document indexing',
})
export class IndexingDocumentStatisticsLLM {
  @PortNumber({
    title: 'Completion Cost',
    description: 'Cost of completion in tokens',
    required: true,
  })
  completion_cost: number = 0

  @PortNumber({
    title: 'Embeddings Cost',
    description: 'Cost of embeddings in tokens',
    required: true,
  })
  embeddings_cost: number = 0

  @PortNumber({
    title: 'Embeddings Count',
    description: 'Number of embeddings',
    required: true,
    integer: true,
  })
  embeddings_count: number = 0

  @PortNumber({
    title: 'Prompt Cost',
    description: 'Cost of prompts in tokens',
    required: true,
  })
  prompt_cost: number = 0

  @PortNumber({
    title: 'Total Cost',
    description: 'Total cost in tokens',
    required: true,
  })
  total_cost: number = 0
}

// Define IndexingDocumentStatistics schema
@ObjectSchema({
  description: 'Represents statistics for document indexing',
})
export class IndexingDocumentStatistics {
  @PortNumber({
    title: 'Chunks Indexed QA',
    description: 'Number of chunks indexed with QA',
    required: true,
    integer: true,
  })
  chunks_indexed_qa: number = 0

  @PortNumber({
    title: 'Chunks Indexed Triplet',
    description: 'Number of chunks indexed with triplets',
    required: true,
    integer: true,
  })
  chunks_indexed_triplet: number = 0

  @PortNumber({
    title: 'Chunks Total',
    description: 'Total number of chunks',
    required: true,
    integer: true,
  })
  chunks_total: number = 0

  @PortNumber({
    title: 'Current Indexing Speed',
    description: 'Current speed of indexing',
    required: true,
  })
  current_indexing_speed: number = 0

  @PortNumber({
    title: 'Expected Finish Seconds',
    description: 'Expected time to finish in seconds',
    integer: true,
  })
  expected_finish_seconds?: number

  @PortString({
    title: 'Expected Finished At',
    description: 'Expected timestamp when indexing will finish',
  })
  expected_finished_at?: string

  @PortNumber({
    title: 'Indexed For Seconds',
    description: 'Time spent indexing in seconds',
    integer: true,
  })
  indexed_for_seconds?: number

  @PortNumber({
    title: 'Indexed Percent',
    description: 'Percentage of indexing completed',
    required: true,
  })
  indexed_percent: number = 0

  @PortString({
    title: 'Indexing Started At',
    description: 'Timestamp when indexing started',
  })
  indexing_started_at?: string

  @PortNumber({
    title: 'LLM Approximate Cost',
    description: 'Approximate cost of LLM usage',
    required: true,
  })
  llm_approximate_cost: number = 0

  @PortObject({
    schema: IndexingDocumentStatisticsLLM,
    title: 'LLM Stats',
    description: 'Statistics for LLM usage',
    required: true,
  })
  llm_stats: IndexingDocumentStatisticsLLM = new IndexingDocumentStatisticsLLM()

  @PortNumber({
    title: 'Pages',
    description: 'Number of pages',
    required: true,
    integer: true,
  })
  pages: number = 0

  @PortNumber({
    title: 'QA Total',
    description: 'Total number of QA pairs',
    required: true,
    integer: true,
  })
  qa_total: number = 0

  @PortNumber({
    title: 'Total Tokens',
    description: 'Total number of tokens',
    required: true,
    integer: true,
  })
  total_tokens: number = 0

  @PortNumber({
    title: 'Triplets Total',
    description: 'Total number of triplets',
    required: true,
    integer: true,
  })
  triplets_total: number = 0
}

// Define IndexingDocumentTaskConfig schema
@ObjectSchema({
  description: 'Represents configuration for document indexing task',
})
export class IndexingDocumentTaskConfig {
  @PortNumber({
    title: 'Chunk Overlap Tokens',
    description: 'Number of tokens to overlap between chunks',
    required: true,
    integer: true,
  })
  chunk_overlap_tokens: number = 0

  @PortNumber({
    title: 'Chunk Size Tokens',
    description: 'Size of chunks in tokens',
    required: true,
    integer: true,
  })
  chunk_size_tokens: number = 0

  @PortNumber({
    title: 'Cost Limit',
    description: 'Maximum cost allowed for indexing',
    required: true,
  })
  cost_limit: number = 0

  @PortBoolean({
    title: 'Force Confirm',
    description: 'Whether to force confirmation',
    required: true,
  })
  force_confirm: boolean = false

  @PortString({
    title: 'Instruction for QA',
    description: 'Instructions for generating QA pairs',
  })
  instruction_for_qa?: string

  @PortBoolean({
    title: 'Need QA',
    description: 'Whether QA pairs should be generated',
    required: true,
  })
  need_qa: boolean = false

  @PortNumber({
    title: 'QA Count Per Run',
    description: 'Number of QA pairs to generate per run',
    required: true,
    integer: true,
  })
  qa_count_per_run: number = 0

  @PortString({
    title: 'QA Model',
    description: 'Model to use for generating QA pairs',
    required: true,
  })
  qa_model: string = ''
}

// Define IndexingDocumentTask schema
@ObjectSchema({
  description: 'Represents a document indexing task',
})
export class IndexingDocumentTask {
  @PortString({
    title: 'Author ID',
    description: 'ID of the participant who created the task',
    required: true,
  })
  author_id: string = ''

  @PortString({
    title: 'Chat ID',
    description: 'ID of the chat where the task was created',
    required: true,
  })
  chat_id: string = ''

  @PortObject({
    schema: IndexingDocumentTaskConfig,
    title: 'Config',
    description: 'Configuration for the indexing task',
    required: true,
  })
  config: IndexingDocumentTaskConfig = new IndexingDocumentTaskConfig()

  @PortBoolean({
    title: 'Confirmed',
    description: 'Whether the task has been confirmed',
    required: true,
  })
  confirmed: boolean = false

  @PortString({
    title: 'Created At',
    description: 'Timestamp when the task was created',
    required: true,
  })
  created_at: string = ''

  @PortString({
    title: 'Document ID',
    description: 'ID of the document to index',
    required: true,
  })
  document_id: string = ''

  @PortString({
    title: 'Error',
    description: 'Error message if the task failed',
  })
  error?: string

  @PortString({
    title: 'Message ID',
    description: 'ID of the message that triggered the task',
    required: true,
  })
  message_id: string = ''

  @PortObject({
    schema: IndexingDocumentStatistics,
    title: 'Statistics',
    description: 'Statistics for the indexing task',
    required: true,
  })
  statistics: IndexingDocumentStatistics = new IndexingDocumentStatistics()

  @PortString({
    title: 'Task ID',
    description: 'Unique identifier for the task',
    required: true,
  })
  task_id: string = ''

  @PortEnum({
    title: 'Task State',
    description: 'Current state of the task',
    options: [
      { id: 'accepted', type: 'string', defaultValue: 'accepted', title: 'Accepted' },
      { id: 'done', type: 'string', defaultValue: 'done', title: 'Done' },
      { id: 'failed', type: 'string', defaultValue: 'failed', title: 'Failed' },
      { id: 'parsing', type: 'string', defaultValue: 'parsing', title: 'Parsing' },
      { id: 'pause_requested', type: 'string', defaultValue: 'pause_requested', title: 'Pause Requested' },
      { id: 'paused', type: 'string', defaultValue: 'paused', title: 'Paused' },
      { id: 'pending', type: 'string', defaultValue: 'pending', title: 'Pending' },
      { id: 'qa_generating', type: 'string', defaultValue: 'qa_generating', title: 'QA Generating' },
      { id: 'rejected', type: 'string', defaultValue: 'rejected', title: 'Rejected' },
      { id: 'waiting_for_confirmation', type: 'string', defaultValue: 'waiting_for_confirmation', title: 'Waiting For Confirmation' },
    ],
    defaultValue: 'pending',
    required: true,
  })
  task_state: string = 'pending'

  @PortString({
    title: 'Update At',
    description: 'Timestamp when the task was last updated',
    required: true,
  })
  update_at: string = ''

  @PortNumber({
    title: 'Version',
    description: 'Version of the task',
    required: true,
    integer: true,
  })
  version: number = 0
}

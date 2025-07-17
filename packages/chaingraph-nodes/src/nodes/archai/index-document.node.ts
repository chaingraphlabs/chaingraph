/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArchAIContext,
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortBoolean,
  PortEnumFromObject,
  PortNumber,
  PortString,
  PortVisibility,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { LLMModels, llmModels } from '../ai'

@Node({
  type: 'ArchAIIndexDocumentNode',
  title: 'ArchAI Index Document',
  description: 'Index a document in the ArchAI Knowledge Database',
  category: NODE_CATEGORIES.ARCH_RAG,
  tags: ['knowledge', 'database', 'documents', 'indexing', 'kdb'],
  ui: {
    state: {
      isHidden: true, // Hide from the UI for now
    },
  },
})
class ArchAIIndexDocumentNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Document ID',
    description: 'ID of the document to index',
    defaultValue: '',
  })
  documentId: string = ''

  @Input()
  @PortString({
    title: 'Chat ID',
    description: 'ID of the chat where the task is created',
    defaultValue: '',
  })
  chatId: string = ''

  @Input()
  @PortString({
    title: 'Message ID',
    description: 'ID of the message that triggered the task',
    defaultValue: '0',
  })
  messageId: string = '0'

  @Input()
  @PortNumber({
    title: 'Chunk Size Tokens',
    description: 'Size of chunks in tokens',
    defaultValue: 500,
  })
  chunkSizeTokens: number = 500

  @Input()
  @PortNumber({
    title: 'Chunk Overlap Tokens',
    description: 'Number of tokens to overlap between chunks',
    defaultValue: 150,
  })
  chunkOverlapTokens: number = 150

  @Input()
  @PortNumber({
    title: 'Cost Limit',
    description: 'Maximum cost allowed for indexing in USD',
    defaultValue: 0.0,
  })
  costLimit: number = 0.0

  @Input()
  @PortVisibility({ showIf: node => (node as ArchAIIndexDocumentNode).needQA })
  @PortBoolean({
    title: 'Need QA',
    description: 'Whether QA pairs should be generated',
    defaultValue: false,
  })
  needQA: boolean = false

  @Input()
  @PortVisibility({ showIf: node => (node as ArchAIIndexDocumentNode).needQA })
  @PortNumber({
    title: 'QA Count Per Run',
    description: 'Number of QA pairs to generate per run',
    defaultValue: 15,
  })
  qaCountPerRun: number = 15

  @Input()
  @PortVisibility({ showIf: node => (node as ArchAIIndexDocumentNode).needQA })
  @PortEnumFromObject(llmModels, {
    title: 'QA Model',
    description: 'Model to use for generating QA pairs',
  })
  qaModel: LLMModels = LLMModels.Gpt41Mini

  @Input()
  @PortVisibility({ showIf: node => (node as ArchAIIndexDocumentNode).needQA })
  @PortString({
    title: 'Instruction for QA',
    description: 'Instructions for generating QA pairs',
    defaultValue: '',
    ui: {
      isTextArea: true,
    },
  })
  instructionForQA: string = ''

  @Input()
  @PortVisibility({ showIf: node => (node as ArchAIIndexDocumentNode).needQA })
  @PortString({
    title: 'QA Model API Token',
    description: 'API token for the QA model',
  })
  qaModelApiToken: string = ''

  @Input()
  @PortBoolean({
    title: 'Force Confirm',
    description: 'Whether to force confirmation',
    defaultValue: false,
  })
  forceConfirm: boolean = false

  @Output()
  @PortString({
    title: 'Task ID',
    description: 'ID of the created indexing task',
    defaultValue: '',
  })
  taskId: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate required inputs
    if (!this.documentId?.trim()) {
      throw new Error('Document ID is required')
    }

    if (this.needQA && !this.qaModelApiToken?.trim()) {
      throw new Error('QA Model API Token is required')
    }

    const archAIContext = context.getIntegration<ArchAIContext>('archai')
    const agentSession = archAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    // Prepare an indexing task input
    const indexingInput = {
      document_id: this.documentId,
      chat_id: this.chatId,
      message_id: this.messageId,
      chunk_size_tokens: this.chunkSizeTokens,
      chunk_overlap_tokens: this.chunkOverlapTokens,
      cost_limit: this.costLimit,
      need_qa: this.needQA,
      qa_count_per_run: this.qaCountPerRun,
      qa_model: this.qaModel,
      qa_model_api_token: this.qaModelApiToken,
      instruction_for_qa: this.instructionForQA,
      force_confirm: this.forceConfirm,
    }

    // Create an indexing task in the knowledge database
    const { kdbIndexingDocumentTaskCreate } = await graphQLClient.request(
      GraphQL.KdbIndexingDocumentTaskCreateDocument,
      {
        session: agentSession,
        input: indexingInput,
      },
    )

    if (!kdbIndexingDocumentTaskCreate) {
      throw new Error('Failed to create indexing task')
    }

    // Set the task ID output
    this.taskId = kdbIndexingDocumentTaskCreate.task_id

    return {}
  }
}

export default ArchAIIndexDocumentNode

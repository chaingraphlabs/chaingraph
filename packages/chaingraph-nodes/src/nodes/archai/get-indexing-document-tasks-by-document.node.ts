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
import { BaseNode, Input, Node, Output, PortArray, PortString } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { IndexingDocumentTask } from './types'

@Node({
  type: 'ArchAIGetIndexingDocumentTasksByDocumentNode',
  title: 'ArchAI Get Indexing Document Tasks By Document',
  description: 'Retrieve indexing document tasks for a specific document in the ArchAI Knowledge Database',
  category: NODE_CATEGORIES.ARCH_RAG,
  tags: ['knowledge', 'database', 'documents', 'indexing', 'tasks', 'kdb'],
})
class ArchAIGetIndexingDocumentTasksByDocumentNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Document ID',
    description: 'ID of the document to retrieve indexing tasks for',
    defaultValue: '',
  })
  documentId: string = ''

  @Input()
  @PortArray({
    itemConfig: {
      type: 'enum',
      options: Object.entries(GraphQL.IndexingDocumentTaskState).map(([key, value]) => ({
        id: value,
        type: 'string',
        defaultValue: value,
        title: key,
      })),
    },
    title: 'State',
    description: 'Filter tasks by state (optional)',
    defaultValue: [],
    isMutable: true,
  })
  state: GraphQL.IndexingDocumentTaskState[] = []

  @Output()
  @PortArray({
    itemConfig: {
      type: 'object',
      schema: IndexingDocumentTask,
      defaultValue: new IndexingDocumentTask(),
    },
    title: 'Tasks',
    description: 'Indexing document tasks retrieved for the document',
    defaultValue: [],
  })
  tasks: GraphQL.KdbIndexingDocumentTaskGetByDocumentQuery['kdbIndexingDocumentTaskGetByDocument'] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate inputs
    if (!this.documentId?.trim()) {
      throw new Error('Document ID is required')
    }

    const archAIContext = context.getIntegration<ArchAIContext>('archai')
    const agentSession = archAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    // Query the knowledge database for indexing tasks for the document
    const { kdbIndexingDocumentTaskGetByDocument } = await graphQLClient.request(
      GraphQL.KdbIndexingDocumentTaskGetByDocumentDocument,
      {
        session: agentSession,
        document_id: [this.documentId],
        state: this.state.length > 0 ? this.state : undefined,
      },
    )

    if (!kdbIndexingDocumentTaskGetByDocument) {
      throw new Error('Failed to retrieve indexing tasks for the document')
    }

    // Convert GraphQL response to our schema objects
    this.tasks = kdbIndexingDocumentTaskGetByDocument

    return {}
  }
}

export default ArchAIGetIndexingDocumentTasksByDocumentNode

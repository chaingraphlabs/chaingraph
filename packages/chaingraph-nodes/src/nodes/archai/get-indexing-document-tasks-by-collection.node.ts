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
  type: 'ArchAIGetIndexingDocumentTasksByCollectionNode',
  title: 'ArchAI Get Indexing Document Tasks By Collection',
  description: 'Retrieve indexing document tasks for a specific collection in the ArchAI Knowledge Database',
  category: NODE_CATEGORIES.ARCH_RAG,
  tags: ['knowledge', 'database', 'documents', 'indexing', 'tasks', 'kdb', 'collection'],
})
class ArchAIGetIndexingDocumentTasksByCollectionNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Collection ID',
    description: 'ID of the collection to retrieve indexing tasks for',
    defaultValue: '',
  })
  collectionId: string = ''

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
    description: 'Indexing document tasks retrieved for the collection',
    defaultValue: [],
  })
  tasks: GraphQL.KdbIndexingDocumentTaskGetByCollectionQuery['kdbIndexingDocumentTaskGetByCollection'] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate inputs
    if (!this.collectionId?.trim()) {
      throw new Error('Collection ID is required')
    }

    const archAIContext = context.getIntegration<ArchAIContext>('archai')
    const agentSession = archAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    // Query the knowledge database for indexing tasks for the collection
    const { kdbIndexingDocumentTaskGetByCollection } = await graphQLClient.request(
      GraphQL.KdbIndexingDocumentTaskGetByCollectionDocument,
      {
        session: agentSession,
        collections: [this.collectionId],
        states: this.state.length > 0 ? this.state : undefined,
      },
    )

    if (!kdbIndexingDocumentTaskGetByCollection) {
      throw new Error('Failed to retrieve indexing tasks for the collection')
    }

    // Convert GraphQL response to our schema objects
    this.tasks = kdbIndexingDocumentTaskGetByCollection

    return {}
  }
}

export default ArchAIGetIndexingDocumentTasksByCollectionNode

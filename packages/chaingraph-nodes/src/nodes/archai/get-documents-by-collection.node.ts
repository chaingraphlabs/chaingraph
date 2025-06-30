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
  PortArray,
  PortEnum,
  PortNumber,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { DocumentMeta } from './types'

@Node({
  type: 'ArchAIGetDocumentsByCollectionNode',
  title: 'ArchAI Get Documents By Collection',
  description: 'Retrieve documents from a specific collection in the ArchAI Knowledge Database',
  category: NODE_CATEGORIES.ARCH_RAG,
  tags: ['knowledge', 'database', 'documents', 'collection', 'kdb'],
  ui: {
    state: {
      isHidden: true, // Hide from the UI for now
    },
  },
})
class ArchAIGetDocumentsByCollectionNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Collection ID',
    description: 'ID of the collection to retrieve documents from',
    defaultValue: '',
  })
  collectionId: string = ''

  @Input()
  @PortEnum({
    title: 'Sort By',
    description: 'Field to sort documents by',
    options: [
      {
        id: GraphQL.DocumentOrderByField.Name,
        type: 'string',
        defaultValue: GraphQL.DocumentOrderByField.Name,
        title: 'Document Name',
      },
      {
        id: GraphQL.DocumentOrderByField.CreatedAt,
        type: 'string',
        defaultValue: GraphQL.DocumentOrderByField.CreatedAt,
        title: 'Creation Date',
      },
      {
        id: GraphQL.DocumentOrderByField.PublishedAt,
        type: 'string',
        defaultValue: GraphQL.DocumentOrderByField.PublishedAt,
        title: 'Publication Date',
      },
    ],
    defaultValue: GraphQL.DocumentOrderByField.PublishedAt,
  })
  sortBy: GraphQL.DocumentOrderByField = GraphQL.DocumentOrderByField.PublishedAt

  @Input()
  @PortEnum({
    title: 'Sort Order',
    description: 'Direction to sort documents',
    options: [
      {
        id: GraphQL.OrderDirection.Asc,
        type: 'string',
        defaultValue: GraphQL.OrderDirection.Asc,
        title: 'Ascending (A-Z, Oldest First)',
      },
      {
        id: GraphQL.OrderDirection.Desc,
        type: 'string',
        defaultValue: GraphQL.OrderDirection.Desc,
        title: 'Descending (Z-A, Newest First)',
      },
    ],
    defaultValue: GraphQL.OrderDirection.Asc,
  })
  sortOrder: GraphQL.OrderDirection = GraphQL.OrderDirection.Asc

  @Input()
  @PortString({
    title: 'Date From',
    description: 'Filter documents by date (from)',
  })
  dateFrom?: string

  @Input()
  @PortString({
    title: 'Date To',
    description: 'Filter documents by date (to)',
  })
  dateTo?: string

  @Input()
  @PortNumber({
    title: 'Limit',
    description: 'Maximum number of documents to return',
    defaultValue: 1000,
    min: 1,
    max: 10000,
  })
  limit: number = 1000

  @Output()
  @PortArray({
    itemConfig: {
      type: 'object',
      schema: DocumentMeta,
    },
    title: 'Documents',
    description: 'Documents retrieved from the collection',
    defaultValue: [],
  })
  documents: GraphQL.KdbGetDocumentsByCollectionQuery['kdbGetDocumentsByCollection'] = []

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

    // Prepare filters
    const filters: GraphQL.GetDocumentsByCollectionFilters = {
      published_range: {},
    }

    // Add date filters if provided
    if (this.dateFrom || this.dateTo) {
      filters.published_range = {
        from: this.dateFrom ? new Date(this.dateFrom).toISOString() : undefined,
        to: this.dateTo ? new Date(this.dateTo).toISOString() : undefined,
      }
    }

    // Query the knowledge database for documents in the collection
    const { kdbGetDocumentsByCollection } = await graphQLClient.request(
      GraphQL.KdbGetDocumentsByCollectionDocument,
      {
        session: agentSession,
        collection_id: this.collectionId,
        filters,
        order_by: {
          field: this.sortBy,
          direction: this.sortOrder,
        },
        limit: this.limit,
      },
    )

    if (!kdbGetDocumentsByCollection) {
      throw new Error('Failed to retrieve documents from the collection')
    }

    // Set the output for documents
    this.documents = kdbGetDocumentsByCollection

    return {}
  }
}

export default ArchAIGetDocumentsByCollectionNode

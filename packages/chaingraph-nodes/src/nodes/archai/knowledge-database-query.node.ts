/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArchAIContext, ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import { PortEnum } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Boolean,
  Input,
  Node,
  Number,
  Output,
  PortArray,
  PortEnumFromNative,
  PortVisibility,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { QAWithSimilarity, QAWithSimilarityByDocuments } from './types'

const qaAccessor = {
  [GraphQL.OrderByField.ChunkNumber]: ({ qa }) => qa.chunk_number,
  [GraphQL.OrderByField.PublishedDate]: ({ qa }) => new Date(qa.document_published_at).getTime(),
  [GraphQL.OrderByField.Similarity]: qa => qa.similarity,
} satisfies Record<GraphQL.OrderByField, (qa: GraphQL.QaWithSimilarity) => number>

@Node({
  type: 'ArchAIKnowledgeDatabaseQueryNode',
  title: 'ArchAI Knowledge Database Query',
  description: 'Query the ArchAI Knowledge Database',
  category: NODE_CATEGORIES.ARCH_RAG,
  tags: ['knowledge', 'database', 'query', 'kdb'],
})
class ArchAIKnowledgeDatabaseQueryNode extends BaseNode {
  @Input()
  @PortArray({
    itemConfig: {
      type: 'string',
    },
    title: 'Collection IDs',
    description: 'IDs of the collections to query',
    defaultValue: [],
  })
  collectionIds: string[] = []

  @Input()
  @String({
    title: 'Query',
    description: 'The query string to search for in the knowledge database',
    defaultValue: '',
  })
  query: string = ''

  @Input()
  @Number({
    title: 'Limit',
    description: 'Maximum number of QA pairs to return',
    defaultValue: 20,
  })
  limit: number = 20

  @Input()
  @Number({
    title: 'Threshold',
    description: 'Similarity threshold for QA pairs (0.0 to 1.0)',
    defaultValue: 0.5,
  })
  threshold: number = 0.5

  @Input()
  @Number({
    title: 'Tokens Limit',
    description: 'Maximum number of tokens to return',
    defaultValue: 4000,
  })
  tokensLimit: number = 4000

  @Input()
  @PortArray({
    itemConfig: {
      type: 'string',
    },
    title: 'Document IDs',
    description: 'Filter results by specific document IDs',
    defaultValue: [],
  })
  documentIds: string[] = []

  @Input()
  @PortArray({
    itemConfig: {
      type: 'string',
    },
    title: 'Keywords',
    description: 'Filter results by specific keywords',
    defaultValue: [],
  })
  keywords: string[] = []

  @Input()
  @String({
    title: 'Published From',
    description: 'Filter results by publication date (from)',
  })
  publishedFrom?: string

  @Input()
  @String({
    title: 'Published To',
    description: 'Filter results by publication date (to)',
  })
  publishedTo?: string

  @Input()
  @Boolean({
    title: 'Group by Documents',
    description: 'Whether to group QA pairs by documents',
    defaultValue: true,
  })
  groupByDocuments: boolean = true

  @Input()
  @PortVisibility({
    showIf: node => (node as ArchAIKnowledgeDatabaseQueryNode).groupByDocuments,
  })
  @PortEnum({
    title: 'Document Order Field',
    description: 'Field to order documents by',
    options: [{
      id: GraphQL.OrderByField.PublishedDate,
      type: 'string',
      defaultValue: GraphQL.OrderByField.PublishedDate,
    }],
  })
  documentOrderField?: GraphQL.OrderByField

  @Input()
  @PortVisibility({
    showIf: (node) => {
      const n = node as ArchAIKnowledgeDatabaseQueryNode
      return !!(n.groupByDocuments && n.documentOrderField)
    },
  })
  @PortEnumFromNative(GraphQL.OrderDirection, {
    title: 'Document Order Direction',
    description: 'Direction to order documents',
  })
  documentOrderDirection?: GraphQL.OrderDirection

  @Input()
  @PortEnum({
    title: 'QA Order Field',
    description: 'Field to order QA pairs by',
    options: [{
      id: GraphQL.OrderByField.ChunkNumber,
      type: 'string',
      defaultValue: GraphQL.OrderByField.ChunkNumber,
    }, {
      id: GraphQL.OrderByField.Similarity,
      type: 'string',
      defaultValue: GraphQL.OrderByField.Similarity,
    }, {
      id: GraphQL.OrderByField.PublishedDate,
      type: 'string',
      defaultValue: GraphQL.OrderByField.PublishedDate,
    }],
  })
  qaOrderField?: GraphQL.OrderByField

  @Input()
  @PortVisibility({
    showIf: node => !!(node as ArchAIKnowledgeDatabaseQueryNode).qaOrderField,
  })
  @PortEnumFromNative(GraphQL.OrderDirection, {
    title: 'QA Order Direction',
    description: 'Direction to order QA pairs',
  })
  qaOrderDirection?: GraphQL.OrderDirection

  @Output()
  @PortVisibility({
    showIf: node => (node as ArchAIKnowledgeDatabaseQueryNode).groupByDocuments,
  })
  @PortArray({
    itemConfig: {
      type: 'object',
      schema: QAWithSimilarityByDocuments,
    },
    title: 'Results (Grouped)',
    description: 'Query results from the knowledge database grouped by documents',
    defaultValue: [],
  })
  resultsGrouped: GraphQL.KdbSearchQaWithDocumentsQuery['kdbSearchQAWithDocuments'] = []

  @Output()
  @PortVisibility({
    showIf: node => !(node as ArchAIKnowledgeDatabaseQueryNode).groupByDocuments,
  })
  @PortArray({
    itemConfig: {
      type: 'object',
      schema: QAWithSimilarity,
    },
    title: 'Results (Flat)',
    description: 'Query results from the knowledge database as a flat array',
    defaultValue: [],
  })
  resultsFlat: GraphQL.QaWithSimilarity[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate inputs
    if (!this.query || this.query.trim() === '') {
      throw new Error('Query string is required')
    }

    if (!this.collectionIds || this.collectionIds.length === 0) {
      throw new Error('At least one collection ID is required')
    }

    if (this.limit <= 0) {
      throw new Error('Limit must be greater than 0')
    }

    if (this.threshold < 0 || this.threshold > 1) {
      throw new Error('Threshold must be between 0.0 and 1.0')
    }

    if (this.tokensLimit <= 0) {
      throw new Error('Tokens limit must be greater than 0')
    }

    // Validate date range if both dates are provided
    if (this.publishedFrom && this.publishedTo) {
      const fromDate = new Date(this.publishedFrom)
      const toDate = new Date(this.publishedTo)

      if (fromDate > toDate) {
        throw new Error('Published From date must be before Published To date')
      }
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
    const filters: Record<string, any> = {}

    if (this.documentIds.length > 0) {
      filters.doc_ids = this.documentIds
    }

    if (this.keywords.length > 0) {
      filters.keywords = this.keywords
    }

    if (this.publishedFrom || this.publishedTo) {
      filters.published_range = {}

      if (this.publishedFrom) {
        filters.published_range.from = this.publishedFrom
      }

      if (this.publishedTo) {
        filters.published_range.to = this.publishedTo
      }
    }

    // Prepare order_by parameter
    let orderBy: Record<string, any> | undefined

    if ((this.groupByDocuments && this.documentOrderField) || this.qaOrderField) {
      orderBy = {}

      if (this.groupByDocuments && this.documentOrderField) {
        orderBy.document_field = this.documentOrderField
        orderBy.document_direction = this.documentOrderDirection
      }

      if (this.qaOrderField) {
        orderBy.qa_field = this.qaOrderField
        orderBy.qa_direction = this.qaOrderDirection
      }
    }

    // Query the knowledge database
    const { kdbSearchQAWithDocuments } = await graphQLClient.request(
      GraphQL.KdbSearchQaWithDocumentsDocument,
      {
        session: agentSession,
        collections: this.collectionIds,
        queries: this.query,
        limit: this.limit,
        threshold: this.threshold,
        tokens_limit: this.tokensLimit,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        order_by: orderBy,
      },
    )

    if (!kdbSearchQAWithDocuments) {
      throw new Error('Failed to query knowledge database')
    }

    // Set the results to the appropriate output port based on groupByDocuments
    if (this.groupByDocuments) {
      this.resultsGrouped = kdbSearchQAWithDocuments
      this.resultsFlat = []
    } else {
      this.resultsGrouped = []
      this.resultsFlat = kdbSearchQAWithDocuments.flatMap(doc => doc.qas)

      if (this.qaOrderField) {
        const accessor = qaAccessor[this.qaOrderField]
        const directionMultiplier = this.qaOrderDirection === GraphQL.OrderDirection.Asc ? 1 : -1
        this.resultsFlat.sort((a, b) => (accessor(a) - accessor(b)) * directionMultiplier)
      }
    }

    return {}
  }
}

export default ArchAIKnowledgeDatabaseQueryNode

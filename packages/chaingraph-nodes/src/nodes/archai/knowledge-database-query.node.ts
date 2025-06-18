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
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  ObjectSchema,
  Output,
  PortArray,
  PortBoolean,
  PortEnum,
  PortEnumFromNative,
  PortNumber,
  PortObject,
  PortString,
  PortVisibility,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { QAWithSimilarity, QAWithSimilarityByDocuments } from './types'

// Configuration Classes
@ObjectSchema()
class SearchConfig {
  @PortArray({
    title: 'Search Queries',
    description: 'Natural language query for semantic search. The system converts this to a 1536-dimensional vector embedding and finds Q&A pairs with high cosine similarity. Be specific and use relevant terminology for best results.',
    itemConfig: {
      type: 'string',
      title: 'Search Query',
      description: 'Natural language query for semantic search. The system converts this to a 1536-dimensional vector embedding and finds Q&A pairs with high cosine similarity. Be specific and use relevant terminology for best results.',
      required: true,
      ui: {
        placeholder: 'How does authentication work?',
      },
    },
    isMutable: true,
  })
  query: string[] = []

  @PortArray({
    itemConfig: {
      type: 'string',
      title: 'Collection ID',
      description: 'UUID of the KDB collection to search within. Collections group related documents and must be created before indexing. Each agent can have multiple collections for different knowledge domains.',
      required: true,
      ui: { placeholder: 'e.g., 123e4567-e89b-12d3-a456-426614174000' },
    },
    title: 'Collection IDs',
    description: 'UUIDs of KDB collections to search within. Collections group related documents and must be created before indexing. Each agent can have multiple collections for different knowledge domains.',
    required: true,
    isMutable: true,
  })
  collectionIds: string[] = []

  @PortNumber({
    title: 'Similarity Threshold',
    description: 'Minimum cosine similarity score (0.0 to 1.0) for results. Higher values (0.7+) return only highly relevant matches, while lower values (0.3-0.5) provide more results with potentially lower relevance.',
    defaultValue: 0.5,
    min: 0,
    max: 1,
    step: 0.1,
    ui: { isSlider: true },
  })
  threshold: number = 0.5
}

@ObjectSchema()
class ResultConfig {
  @PortNumber({
    title: 'Result Limit',
    description: 'Maximum number of Q&A pairs to return. Results are ranked by similarity score and filtered by the threshold. Consider your LLM context window when setting this value.',
    defaultValue: 20,
    min: 1,
    max: 100,
  })
  limit: number = 20

  @PortNumber({
    title: 'Token Limit',
    description: 'Maximum total tokens across all returned Q&A pairs. Prevents exceeding LLM context windows. The system counts tokens in both questions and answers using tiktoken.',
    defaultValue: 4000,
    min: 100,
    max: 32000,
    step: 100,
  })
  tokensLimit: number = 4000

  @PortBoolean({
    title: 'Group by Documents',
    description: 'Organize results by source document. When enabled, Q&A pairs are grouped under their parent documents with metadata. When disabled, returns a flat array of Q&A pairs sorted by relevance.',
    defaultValue: true,
  })
  groupByDocuments: boolean = true
}

@ObjectSchema()
class FilterConfig {
  @PortArray({
    itemConfig: {
      type: 'string',
    },
    title: 'Document IDs',
    description: 'Optional: Filter results to specific document UUIDs. Useful when you know which documents contain relevant information.',
  })
  documentIds: string[] = []

  @PortArray({
    itemConfig: {
      type: 'string',
    },
    title: 'Keywords',
    description: 'Optional: Additional keyword-based filtering on top of semantic search. Results must contain at least one of these keywords in either the question or answer text. Case-insensitive matching.',
  })
  keywords: string[] = []

  @PortString({
    title: 'Published After',
    description: 'Optional: Filter results to documents published after this date. Use ISO 8601 format (YYYY-MM-DD or full timestamp).',
    ui: {
      placeholder: '2024-01-01',
    },
  })
  publishedFrom?: string

  @PortString({
    title: 'Published Before',
    description: 'Optional: Filter results to documents published before this date. Use ISO 8601 format (YYYY-MM-DD or full timestamp).',
    ui: {
      placeholder: '2024-12-31',
    },
  })
  publishedTo?: string
}

@ObjectSchema()
class SortingConfigDocuments {
  @PortEnum({
    title: 'Document Sort Field',
    description: 'When grouping by documents, sort documents by publication date. This affects the order of document groups in the results.',
    options: [{
      id: GraphQL.OrderByField.PublishedDate,
      type: 'string',
      defaultValue: GraphQL.OrderByField.PublishedDate,
    }],
  })
  documentOrderField?: GraphQL.OrderByField

  @PortEnumFromNative(GraphQL.OrderDirection, {
    title: 'Document Sort Direction',
    description: 'Sort direction for document groups. Ascending shows oldest documents first, Descending shows newest first.',
  })
  documentOrderDirection?: GraphQL.OrderDirection
}

@ObjectSchema()
class SortingConfigQA {
  @PortEnum({
    title: 'Q&A Sort Field',
    description: 'Sort Q&A pairs by: ChunkNumber (document order), Similarity (relevance score), or PublishedDate (when the source was published).',
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

  @PortEnumFromNative(GraphQL.OrderDirection, {
    title: 'Q&A Sort Direction',
    description: 'Sort direction for Q&A pairs. For similarity, Descending shows most relevant first. For chunk number, Ascending maintains reading order.',
  })
  qaOrderDirection?: GraphQL.OrderDirection
}

@ObjectSchema()
class SearchStatistics {
  @PortNumber({
    title: 'Total Documents',
    description: 'Number of unique documents in the results',
  })
  totalDocuments: number = 0

  @PortNumber({
    title: 'Total Q&A Pairs',
    description: 'Total number of question-answer pairs returned',
  })
  totalQAPairs: number = 0

  @PortNumber({
    title: 'Average Similarity',
    description: 'Average similarity score across all results',
  })
  averageSimilarity: number = 0

  @PortNumber({
    title: 'Token Count',
    description: 'Total tokens used by all Q&A pairs',
  })
  tokenCount: number = 0

  @PortNumber({
    title: 'Search Duration (ms)',
    description: 'Time taken to perform the search',
  })
  searchDuration: number = 0
}

const qaAccessor = {
  [GraphQL.OrderByField.Similarity]: (qa: GraphQL.QaWithSimilarity) => qa.similarity,
  [GraphQL.OrderByField.ChunkNumber]: (qa: GraphQL.QaWithSimilarity) => qa.qa.chunk_number,
  [GraphQL.OrderByField.PublishedDate]: (qa: GraphQL.QaWithSimilarity) => new Date(qa.qa.document_published_at).getTime(),
}

@Node({
  type: 'ArchAIKnowledgeDatabaseQueryNode',
  title: 'ArchAI Knowledge Database Query',
  description: 'Enhanced semantic search across document collections using vector similarity. Features improved organization, validation, and statistics. Searches through indexed Q&A pairs to find the most relevant information.',
  category: NODE_CATEGORIES.ARCH_RAG,
  tags: ['knowledge', 'database', 'query', 'kdb', 'semantic-search', 'vector-search', 'rag'],
})
class ArchAIKnowledgeDatabaseQueryNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Search Configuration',
    description: 'Core search parameters including query and collections',
    schema: SearchConfig,
    required: true,
  })
  searchConfig: SearchConfig = new SearchConfig()

  @Input()
  @PortObject({
    title: 'Result Configuration',
    description: 'Control how results are returned and organized',
    schema: ResultConfig,
  })
  resultConfig: ResultConfig = new ResultConfig()

  @Input()
  @PortObject({
    title: 'Filters',
    description: 'Optional filters to narrow search results',
    schema: FilterConfig,
  })
  filterConfig: FilterConfig = new FilterConfig()

  @Input()
  @PortVisibility({
    showIf: node => (node as ArchAIKnowledgeDatabaseQueryNode).resultConfig.groupByDocuments,
  })
  @PortObject({
    title: 'Sorting Documents',
    description: 'Configure how Documents are sorted when grouping results',
    schema: SortingConfigDocuments,
    ui: {
      collapsed: false,
    },
  })
  sortingConfigDocuments: SortingConfigDocuments = new SortingConfigDocuments()

  @Input()
  @PortObject({
    title: 'Sorting Q&A Pairs',
    description: 'Configure how Q&A pairs are sorted',
    schema: SortingConfigQA,
    ui: {
      collapsed: false,
    },
  })
  sortingConfigQA: SortingConfigQA = new SortingConfigQA()

  @Output()
  @PortVisibility({
    showIf: node => (node as ArchAIKnowledgeDatabaseQueryNode).resultConfig.groupByDocuments,
  })
  @PortArray({
    itemConfig: {
      type: 'object',
      schema: QAWithSimilarityByDocuments,
    },
    title: 'Grouped Results',
    description: 'Search results organized by source document. Each document includes metadata (name, URL, publication date) and its relevant Q&A pairs with similarity scores.',
  })
  resultsGrouped: GraphQL.KdbSearchQaWithDocumentsQuery['kdbSearchQAWithDocuments'] = []

  @Output()
  @PortVisibility({
    showIf: node => !(node as ArchAIKnowledgeDatabaseQueryNode).resultConfig.groupByDocuments,
  })
  @PortArray({
    itemConfig: {
      type: 'object',
      schema: QAWithSimilarity,
    },
    title: 'Flat Results',
    description: 'Search results as a simple array of Q&A pairs with similarity scores. Each result includes the question, answer, chunk location, and relevance score.',
  })
  resultsFlat: GraphQL.QaWithSimilarity[] = []

  @Output()
  @PortObject({
    title: 'Statistics',
    description: 'Statistical information about the search results',
    schema: SearchStatistics,
    ui: {
      hidePropertyEditor: true,
    },
  })
  statistics: SearchStatistics = new SearchStatistics()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now()

    // Validate inputs
    this.validateInputs()

    // Reset outputs
    this.resetOutputs()

    // Log search parameters
    await this.logSearchStart(context)

    // Perform the search
    const results = await this.performSearch(context)

    // Process and set results
    this.processResults(results)

    // Calculate statistics
    this.calculateStatistics(results, startTime)

    // Log results summary
    await this.logSearchComplete(context)

    return {}
  }

  private validateInputs(): void {
    // Validate search config
    if (!this.searchConfig.query || this.searchConfig.query.length === 0) {
      throw new Error('Search query is required')
    }

    if (!this.searchConfig.collectionIds || this.searchConfig.collectionIds.length === 0) {
      throw new Error('At least one collection ID is required')
    }

    if (this.searchConfig.threshold < 0 || this.searchConfig.threshold > 1) {
      throw new Error('Similarity threshold must be between 0.0 and 1.0')
    }

    // Validate result config
    if (this.resultConfig.limit <= 0) {
      throw new Error('Result limit must be greater than 0')
    }

    if (this.resultConfig.tokensLimit <= 0) {
      throw new Error('Token limit must be greater than 0')
    }

    // Validate date range if provided
    if (this.filterConfig.publishedFrom || this.filterConfig.publishedTo) {
      this.validateDateRange()
    }
  }

  private validateDateRange(): void {
    const { publishedFrom, publishedTo } = this.filterConfig

    // Validate format
    if (publishedFrom && !this.isValidISO8601(publishedFrom)) {
      throw new Error('Published After must be in ISO 8601 format (e.g., 2024-01-01 or 2024-01-01T00:00:00Z)')
    }

    if (publishedTo && !this.isValidISO8601(publishedTo)) {
      throw new Error('Published Before must be in ISO 8601 format (e.g., 2024-12-31 or 2024-12-31T23:59:59Z)')
    }

    // Validate date order
    if (publishedFrom && publishedTo) {
      const fromDate = new Date(publishedFrom)
      const toDate = new Date(publishedTo)

      if (Number.isNaN(fromDate.getTime())) {
        throw new TypeError('Published After is not a valid date')
      }

      if (Number.isNaN(toDate.getTime())) {
        throw new TypeError('Published Before is not a valid date')
      }

      if (fromDate > toDate) {
        throw new Error('Published After date must be before Published Before date')
      }
    }
  }

  private isValidISO8601(dateString: string): boolean {
    // Support both date-only and full timestamp formats
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?$/

    return dateOnlyRegex.test(dateString) || timestampRegex.test(dateString)
  }

  private resetOutputs(): void {
    this.resultsGrouped = []
    this.resultsFlat = []
    this.statistics = new SearchStatistics()
  }

  private async logSearchStart(context: ExecutionContext): Promise<void> {
    await context.sendEvent({
      type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
      data: {
        node: this.clone(),
        log: `KDB Search started: Query="${this.searchConfig.query}" | Collections=${this.searchConfig.collectionIds.length} | Threshold=${this.searchConfig.threshold}`,
      },
      index: 0,
      timestamp: new Date(),
    })
  }

  private async logSearchComplete(context: ExecutionContext): Promise<void> {
    await context.sendEvent({
      type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
      data: {
        node: this.clone(),
        log: `KDB Search completed: Documents=${this.statistics.totalDocuments} | Q&A Pairs=${this.statistics.totalQAPairs} | Avg Similarity=${this.statistics.averageSimilarity.toFixed(3)} | Duration=${this.statistics.searchDuration}ms`,
      },
      index: 0,
      timestamp: new Date(),
    })
  }

  private async performSearch(context: ExecutionContext): Promise<GraphQL.KdbSearchQaWithDocumentsQuery['kdbSearchQAWithDocuments']> {
    const archAIContext = this.getArchAIContext(context)
    const graphQLClient = this.createGraphQLClient()

    if (!archAIContext.agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const { kdbSearchQAWithDocuments } = await graphQLClient.request(
      GraphQL.KdbSearchQaWithDocumentsDocument,
      this.buildSearchParameters(archAIContext.agentSession),
    )

    if (!kdbSearchQAWithDocuments) {
      throw new Error('No results returned from knowledge database')
    }

    return kdbSearchQAWithDocuments
  }

  private getArchAIContext(context: ExecutionContext): ArchAIContext {
    const archAIContext = context.getIntegration<ArchAIContext>('archai')
    if (!archAIContext?.agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }
    return archAIContext
  }

  private createGraphQLClient() {
    return createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )
  }

  private buildSearchParameters(session: string): any {
    return {
      session,
      collections: this.searchConfig.collectionIds,
      queries: this.searchConfig.query,
      limit: this.resultConfig.limit,
      threshold: this.searchConfig.threshold,
      tokens_limit: this.resultConfig.tokensLimit,
      filters: this.buildFilters(),
      order_by: this.buildOrderBy(),
    }
  }

  private buildFilters(): any | undefined {
    const filters: any = {}

    if (this.filterConfig.documentIds?.length > 0) {
      filters.doc_ids = this.filterConfig.documentIds
    }

    if (this.filterConfig.keywords?.length > 0) {
      filters.keywords = this.filterConfig.keywords
    }

    const dateRange = this.buildDateRange()
    if (dateRange) {
      filters.published_range = dateRange
    }

    return Object.keys(filters).length > 0 ? filters : undefined
  }

  private buildDateRange(): any | undefined {
    const { publishedFrom, publishedTo } = this.filterConfig

    if (!publishedFrom && !publishedTo) {
      return undefined
    }

    const range: any = {}
    if (publishedFrom) {
      range.from = publishedFrom
    }
    if (publishedTo) {
      range.to = publishedTo
    }

    return range
  }

  private buildOrderBy(): any | undefined {
    const orderBy: any = {}

    // Document ordering when grouping
    if (this.resultConfig.groupByDocuments && this.sortingConfigDocuments.documentOrderField) {
      orderBy.document_field = this.sortingConfigDocuments.documentOrderField
      orderBy.document_direction = this.sortingConfigDocuments.documentOrderDirection || GraphQL.OrderDirection.Desc
    }

    // QA ordering
    if (this.sortingConfigQA.qaOrderField) {
      orderBy.qa_field = this.sortingConfigQA.qaOrderField
      orderBy.qa_direction = this.sortingConfigQA.qaOrderDirection || GraphQL.OrderDirection.Desc
    }

    return Object.keys(orderBy).length > 0 ? orderBy : undefined
  }

  private processResults(results: GraphQL.KdbSearchQaWithDocumentsQuery['kdbSearchQAWithDocuments']): void {
    if (this.resultConfig.groupByDocuments) {
      this.resultsGrouped = results
      this.resultsFlat = []
    } else {
      this.resultsGrouped = []
      this.resultsFlat = results.flatMap(doc => doc.qas)

      // Apply sorting to flat results
      this.sortFlatResults()
    }
  }

  private sortFlatResults(): void {
    if (!this.sortingConfigQA || !this.sortingConfigQA.qaOrderField)
      return

    const accessor = qaAccessor[this.sortingConfigQA.qaOrderField]
    const directionMultiplier = this.sortingConfigQA.qaOrderDirection === GraphQL.OrderDirection.Asc ? 1 : -1

    this.resultsFlat.sort((a, b) => {
      const aValue = accessor(a)
      const bValue = accessor(b)
      return (aValue - bValue) * directionMultiplier
    })
  }

  private calculateStatistics(
    results: GraphQL.KdbSearchQaWithDocumentsQuery['kdbSearchQAWithDocuments'],
    startTime: number,
  ): void {
    this.statistics.searchDuration = Date.now() - startTime
    this.statistics.totalDocuments = results.length

    let totalQAPairs = 0
    let totalSimilarity = 0
    let totalTokens = 0

    for (const doc of results) {
      for (const qaItem of doc.qas) {
        totalQAPairs++
        totalSimilarity += qaItem.similarity

        // Estimate tokens (rough approximation)
        const questionTokens = qaItem.qa.question_tokens || this.estimateTokens(qaItem.qa.question)
        const answerTokens = qaItem.qa.answer_tokens || this.estimateTokens(qaItem.qa.answer)
        totalTokens += questionTokens + answerTokens
      }
    }

    this.statistics.totalQAPairs = totalQAPairs
    this.statistics.tokenCount = totalTokens
    this.statistics.averageSimilarity = totalQAPairs > 0 ? totalSimilarity / totalQAPairs : 0
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }
}

export default ArchAIKnowledgeDatabaseQueryNode

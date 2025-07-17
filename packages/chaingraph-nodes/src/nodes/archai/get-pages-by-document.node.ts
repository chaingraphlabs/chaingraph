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
  PortNumber,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { Page } from './types'

@Node({
  type: 'ArchAIGetPagesByDocumentNode',
  title: 'ArchAI Get Pages By Document',
  description: 'Retrieve pages from a specific document in the ArchAI Knowledge Database',
  category: NODE_CATEGORIES.ARCH_RAG,
  tags: ['knowledge', 'database', 'documents', 'pages', 'kdb'],
})
class ArchAIGetPagesByDocumentNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Document ID',
    description: 'ID of the document to retrieve pages from',
    defaultValue: '',
  })
  documentId: string = ''

  @Input()
  @PortNumber({
    title: 'Page From',
    description: 'Starting page number to retrieve',
    min: 0,
  })
  pageFrom?: number

  @Input()
  @PortNumber({
    title: 'Page To',
    description: 'Ending page number to retrieve',
    min: 0,
  })
  pageTo?: number

  @Output()
  @PortString({
    title: 'Full Text',
    description: 'Concatenated text content of all pages',
    defaultValue: '',
  })
  fullText: string = ''

  @Output()
  @PortArray({
    itemConfig: {
      type: 'object',
      schema: Page,
      defaultValue: new Page(),
    },
    title: 'Pages',
    description: 'Pages retrieved from the document',
    defaultValue: [],
  })
  pages: GraphQL.KdbGetPagesByDocumentQuery['kdbGetPagesByDocument'] = []

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

    // Prepare filters for page range if specified
    const filters: GraphQL.GetPagesByDocumentFilters = {
      pages_range: {},
    }

    // Add page range filters if provided
    if (this.pageFrom || this.pageTo) {
      filters.pages_range = {
        from: this.pageFrom,
        to: this.pageTo,
      }
    }

    // Query the knowledge database for pages in the document
    const { kdbGetPagesByDocument } = await graphQLClient.request(
      GraphQL.KdbGetPagesByDocumentDocument,
      {
        session: agentSession,
        document_id: this.documentId,
        filters,
      },
    )

    if (!kdbGetPagesByDocument) {
      throw new Error('Failed to retrieve pages from the document')
    }

    // Set the output for pages
    this.pages = kdbGetPagesByDocument

    // Concatenate all page content to create the full text
    this.fullText = kdbGetPagesByDocument
      .map(page => page.content)
      .join('\n\n')

    return {}
  }
}

export default ArchAIGetPagesByDocumentNode

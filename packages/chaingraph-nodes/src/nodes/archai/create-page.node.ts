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
  ObjectSchema,
  Output,
  PortArray,
  PortNumber,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

// Define PageInput schema
@ObjectSchema({
  description: 'Represents input for creating a page in a document',
  type: 'PageInput',
})
export class PageInput {
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
    title: 'Description',
    description: 'Description of the page (optional)',
  })
  description?: string

  @PortNumber({
    title: 'Page Number',
    description: 'Page number within the document',
    required: true,
    integer: true,
    defaultValue: 0,
  })
  pageNumber: number = 0
}

@Node({
  type: 'ArchAICreatePageNode',
  title: 'ArchAI Create Pages',
  description: 'Append multiple pages to an existing document in the ArchAI Knowledge Database. Each page has its own content, description, and page number.',
  category: NODE_CATEGORIES.ARCH_RAG,
  tags: ['knowledge', 'database', 'documents', 'pages', 'kdb'],
})
class ArchAICreatePageNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Document ID',
    description: 'ID of the document to append the pages to',
    defaultValue: '',
  })
  documentId: string = ''

  @Input()
  @PortArray({
    title: 'Pages',
    description: 'Array of pages to create. Each page has its own content, description, and page number.',
    itemConfig: {
      type: 'object',
      schema: PageInput,
      defaultValue: new PageInput(),
    },
    defaultValue: [],
  })
  pages: PageInput[] = []

  @Input()
  @PortString({
    title: 'Task ID',
    description: 'ID of the task that processed these pages',
    defaultValue: '',
  })
  taskId: string = ''

  @Output()
  @PortArray({
    title: 'Page IDs',
    description: 'IDs of the created pages',
    itemConfig: {
      type: 'string',
    },
    defaultValue: [],
  })
  pageIds: string[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate required inputs
    if (!this.documentId?.trim()) {
      throw new Error('Document ID is required')
    }
    if (!this.pages || this.pages.length === 0) {
      throw new Error('At least one page is required')
    }
    if (!this.taskId?.trim()) {
      throw new Error('Task ID is required')
    }

    const archAIContext = context.getIntegration<ArchAIContext>('archai')
    const agentSession = archAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    // Prepare page inputs from the pages array
    const pageInputs = this.pages.map(page => ({
      document_id: this.documentId,
      content: page.content,
      description: page.description || undefined,
      number: page.pageNumber,
      task_id: this.taskId,
    }))

    // Create pages in the knowledge database
    const { kdbCreatePage } = await graphQLClient.request(
      GraphQL.KdbCreatePageDocument,
      {
        session: agentSession,
        pages: pageInputs,
      },
    )

    if (!kdbCreatePage || kdbCreatePage.length === 0) {
      throw new Error('Failed to create pages')
    }

    // Set the page IDs output
    this.pageIds = kdbCreatePage.map(page => page.page_id)

    return {}
  }
}

export default ArchAICreatePageNode

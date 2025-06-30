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
import { DocumentMetadataKV } from './types'

@Node({
  type: 'ArchAICreateDocumentNode',
  title: 'ArchAI Create Document',
  description: 'Upload a document to the ArchAI Knowledge Database',
  category: NODE_CATEGORIES.ARCH_RAG,
  tags: ['knowledge', 'database', 'documents', 'upload', 'kdb'],
  ui: {
    state: {
      isHidden: true, // Hide from the UI for now
    },
  },
})
class ArchAICreateDocumentNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Collection ID',
    description: 'ID of the collection this document belongs to',
    defaultValue: '',
  })
  collectionId: string = ''

  @Input()
  @PortString({
    title: 'Name',
    description: 'Name of the document',
    defaultValue: '',
  })
  name: string = ''

  @Input()
  @PortString({
    title: 'Description',
    description: 'Description of the document',
    defaultValue: '',
  })
  description: string = ''

  @Input()
  @PortString({
    title: 'URL',
    description: 'Link to the document',
    defaultValue: '',
  })
  url: string = ''

  @Input()
  @PortArray({
    title: 'Tags',
    description: 'Tags associated with the document',
    itemConfig: {
      type: 'string',
    },
    defaultValue: [],
  })
  tags: string[] = []

  @Input()
  @PortArray({
    title: 'Metadata',
    description: 'Additional metadata for the document as key-value pairs',
    itemConfig: {
      type: 'object',
      schema: DocumentMetadataKV,
      defaultValue: new DocumentMetadataKV(),
    },
    defaultValue: [],
  })
  documentMetadata: DocumentMetadataKV[] = []

  @Output()
  @PortString({
    title: 'Document ID',
    description: 'ID of the created document',
    defaultValue: '',
  })
  documentId: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate required inputs
    if (!this.collectionId?.trim()) {
      throw new Error('Collection ID is required')
    }
    if (!this.name?.trim()) {
      throw new Error('Name is required')
    }
    if (!this.url?.trim()) {
      throw new Error('URL is required')
    }

    const archAIContext = context.getIntegration<ArchAIContext>('archai')
    const agentSession = archAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    // Prepare document metadata input
    const documentInput = {
      collection_id: this.collectionId,
      name: this.name,
      description: this.description,
      url: this.url,
      tags: this.tags,
      metadata: this.documentMetadata,
    }

    // Create a document in the knowledge database
    const { kdbCreateDocument } = await graphQLClient.request(
      GraphQL.KdbCreateDocumentDocument,
      {
        session: agentSession,
        doc: documentInput,
      },
    )

    if (!kdbCreateDocument) {
      throw new Error('Failed to create document')
    }

    // Set the document ID output
    this.documentId = kdbCreateDocument.document_id

    return {}
  }
}

export default ArchAICreateDocumentNode

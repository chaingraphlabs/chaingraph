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
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'ArchAICreateCollectionNode',
  title: 'ArchAI Create Collection',
  description: 'Create a new collection in the ArchAI Knowledge Database',
  category: NODE_CATEGORIES.ARCH_RAG,
  tags: ['knowledge', 'database', 'collection', 'kdb'],
})
class ArchAICreateCollectionNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Name',
    description: 'Name of the collection',
    defaultValue: '',
  })
  name: string = ''

  @Input()
  @PortString({
    title: 'Description',
    description: 'Description of the collection',
    defaultValue: '',
    ui: {
      isTextArea: true,
    },
  })
  description: string = ''

  @Input()
  @PortArray({
    title: 'Tags',
    description: 'Tags for the collection',
    defaultValue: [],
    itemConfig: {
      type: 'string',
    },
    isMutable: true,
    ui: {
      addItemFormHidden: false,
    },
  })
  tags: string[] = []

  @Output()
  @PortString({
    title: 'Collection ID',
    description: 'ID of the created collection',
    defaultValue: '',
  })
  collectionId: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate required inputs
    if (!this.name?.trim()) {
      throw new Error('Name is required')
    }
    if (!this.description?.trim()) {
      throw new Error('Description is required')
    }
    if (!this.tags || this.tags.length === 0) {
      throw new Error('At least one tag is required')
    }

    const archAIContext = context.getIntegration<ArchAIContext>('archai')

    const agentSession = archAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const agentID = archAIContext?.agentID
    if (!agentID) {
      throw new Error('ArchAI agent ID is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    // Prepare collection input
    const collectionInput = {
      agent_id: agentID,
      name: this.name,
      description: this.description,
      tags: this.tags,
    }

    // Create a collection in the knowledge database
    const { kdbCreateAgentCollection } = await graphQLClient.request(
      GraphQL.KdbCreateCollectionDocument,
      {
        session: agentSession,
        input: collectionInput,
      },
    )

    if (!kdbCreateAgentCollection) {
      throw new Error('Failed to create collection')
    }

    // Set the collection ID output
    this.collectionId = kdbCreateAgentCollection.collection_id

    return {}
  }
}

export default ArchAICreateCollectionNode

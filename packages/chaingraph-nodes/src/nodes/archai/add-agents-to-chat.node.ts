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
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortArray,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'AddAgentsToChatArchAINode',
  title: 'ArchAI Add Agents to Chat',
  description: 'Adds multiple agents to the current chat conversation',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['agent', 'chat', 'add'],
})
class AddAgentsToChatArchAINode extends BaseNode {
  @Input()
  @PortArray({
    title: 'Agent IDs',
    description: 'List of agent IDs to add to the chat',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
    isMutable: true,
  })
  agentIDs: string[] = []

  @Output()
  @PortArray({
    title: 'Added Agent IDs',
    description: 'List of agent IDs successfully added to the chat',
    itemConfig: {
      type: 'string',
    },
  })
  addedAgentIDs: string[] = []

  @Output()
  @PortArray({
    title: 'Failed Agent IDs',
    description: 'List of agent IDs that failed to be added',
    itemConfig: {
      type: 'string',
    },
  })
  failedAgentIDs: string[] = []

  @Output()
  @PortArray({
    title: 'Already in Chat',
    description: 'List of agent IDs that were already in the chat',
    itemConfig: {
      type: 'string',
    },
  })
  alreadyInChatAgentIDs: string[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate agent IDs
    if (!this.agentIDs || this.agentIDs.length === 0) {
      throw new Error('At least one agent ID is required to add agents to chat')
    }

    const archAIContext = context.getIntegration<ArchAIContext>('archai')

    const agentSession = archAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const chatID = archAIContext?.chatID
    if (!chatID) {
      throw new Error('ArchAI chat ID is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    // Initialize arrays
    this.addedAgentIDs = []
    this.failedAgentIDs = []
    this.alreadyInChatAgentIDs = []

    // Get current chat participants
    const { getChatRoom } = await graphQLClient.request(GraphQL.GetChatRoomDocument, {
      session: agentSession,
      chat_id: chatID,
    })

    if (!getChatRoom) {
      throw new Error('Failed to get chat room information')
    }

    // Extract existing agent IDs from participants
    const existingAgentIDs = new Set(
      getChatRoom.participants
        ?.filter(p => p.is_agent && p.agent_id)
        .map(p => p.agent_id) || [],
    )

    // Add each agent to the chat
    for (const agentID of this.agentIDs) {
      // Skip if agent is already in the chat
      if (existingAgentIDs.has(agentID)) {
        this.alreadyInChatAgentIDs.push(agentID)
        continue
      }

      try {
        const { addAgentToChat } = await graphQLClient.request(GraphQL.AddAgentToChatDocument, {
          session: agentSession,
          chat_id: chatID,
          agent_id: agentID,
        })

        if (addAgentToChat) {
          this.addedAgentIDs.push(agentID)
        } else {
          this.failedAgentIDs.push(agentID)
        }
      } catch (error) {
        // If adding an agent fails, add it to the failed list
        this.failedAgentIDs.push(agentID)
        console.error(`Failed to add agent ${agentID} to chat:`, error)
      }
    }

    return {}
  }
}

export default AddAgentsToChatArchAINode

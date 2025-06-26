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
  PortBoolean,
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
  @PortBoolean({
    title: 'Success',
    description: 'True if all agents were processed without errors',
  })
  success: boolean = false

  @Output()
  @PortArray({
    title: 'Results',
    description: 'Detailed results for each agent',
    itemConfig: {
      type: 'object',
      schema: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            title: 'Agent ID',
            description: 'ID of the agent',
          },
          success: {
            type: 'boolean',
            title: 'Success',
            description: 'True if agent was added or already existed, false if failed',
          },
          error: {
            type: 'string',
            title: 'Error',
            description: 'Error message if success is false',
            required: false,
          },
        },
      },
    },
  })
  results: Array<{ agent_id: string, success: boolean, error?: string }> = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate agent IDs
    if (!this.agentIDs || this.agentIDs.length === 0) {
      throw new Error('At least one agent ID is required to add agents to chat')
    }

    // Validate all agent IDs are non-empty strings
    if (!this.agentIDs.every(id => id && typeof id === 'string' && id.trim().length > 0)) {
      throw new Error('All agent IDs must be non-empty strings')
    }

    // Remove duplicates
    const uniqueAgentIDs = [...new Set(this.agentIDs.map(id => id.trim()))]

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

    // Initialize outputs
    this.results = []
    this.success = false

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

    // Process agents concurrently for better performance
    const addAgentPromises = uniqueAgentIDs.map(async (agentID) => {
      // Skip if agent is already in the chat
      if (existingAgentIDs.has(agentID)) {
        return { agent_id: agentID, success: true, error: undefined }
      }

      try {
        const { addAgentToChat } = await graphQLClient.request(GraphQL.AddAgentToChatDocument, {
          session: agentSession,
          chat_id: chatID,
          agent_id: agentID,
        })

        if (addAgentToChat) {
          return { agent_id: agentID, success: true, error: undefined }
        } else {
          return { agent_id: agentID, success: false, error: 'API returned false' }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { agent_id: agentID, success: false, error: errorMessage }
      }
    })

    // Wait for all operations to complete
    const promiseResults = await Promise.allSettled(addAgentPromises)

    // Process results and determine overall success
    let hasErrors = false

    for (const result of promiseResults) {
      if (result.status === 'fulfilled') {
        const { agent_id, success, error } = result.value

        // Add to results array
        const resultEntry: { agent_id: string, success: boolean, error?: string } = {
          agent_id,
          success,
        }

        if (error) {
          resultEntry.error = error
        }

        if (!success) {
          hasErrors = true
        }

        this.results.push(resultEntry)
      } else {
        // Promise rejection - this shouldn't happen with our current implementation
        console.error('Unexpected promise rejection:', result.reason)
        hasErrors = true
      }
    }

    // Set overall success
    this.success = !hasErrors

    return {}
  }
}

export default AddAgentsToChatArchAINode

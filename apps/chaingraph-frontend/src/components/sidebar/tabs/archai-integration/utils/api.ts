/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Node.js process for environment variables
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'

// Default API URL, can be overridden by environment variables
const DEFAULT_API_URL = 'http://0.0.0.0:9151/graphql'

/**
 * Creates and returns a GraphQL client configured with the provided API URL
 * @param apiUrl Optional API URL override
 * @returns Configured GraphQL client instance
 */
export function getGraphQLClient(apiUrl?: string) {
  return createGraphQLClient(apiUrl || DEFAULT_API_URL)
}

/**
 * Type alias for the userSession token used in API calls
 */
export type UserSession = string

/**
 * Fetch user profile data using the provided session token
 * @param session User session token
 * @returns Promise with user profile data
 */
export async function fetchUserProfile(session: UserSession) {
  const client = getGraphQLClient()
  const { userProfile } = await client.request(GraphQL.GetUserProfileDocument, {
    session,
  })
  return userProfile
}

/**
 * Fetch available agents for the user
 * @param session User session token
 * @returns Promise with agent collections data
 */
export async function fetchAgents(session: UserSession) {
  const client = getGraphQLClient()
  const { marketplaceAgents } = await client.request(GraphQL.MarketplaceAgentsDocument, {
    session,
  })
  return marketplaceAgents as GraphQL.AgentCollectionFieldsFragment[]
}

/**
 * Fetch chat rooms for the user
 * @param session User session token
 * @returns Promise with chat rooms data
 */
export async function fetchChatRooms(session: UserSession) {
  const client = getGraphQLClient()
  const { getChatRooms } = await client.request(GraphQL.GetChatRoomsDocument, {
    session,
  })
  return getChatRooms as GraphQL.ChatRoom[]
}

/**
 * Fetch messages from a specific chat
 * @param session User session token
 * @param chatId ID of the chat to fetch messages from
 * @param fromId Optional ID to start fetching from
 * @param limit Optional limit of messages to fetch
 * @param order Optional order of messages (ASC/DESC)
 * @returns Promise with messages data
 */
export async function fetchMessages(
  session: UserSession,
  chatId: string,
  fromId: number = 0,
  limit: number = 100,
  order: string = 'DESC',
) {
  const client = getGraphQLClient()
  const { messages } = await client.request(GraphQL.GetMessagesDocument, {
    session,
    chat_id: chatId,
    from: fromId,
    limit,
    order,
  })
  return messages as GraphQL.MessageFieldsFragment[]
}

/**
 * Fetch an agent session using the provided session token and agent ID
 * @param session User session token
 * @param agentId ID of the agent to fetch the session for
 * @returns Promise with agent session data
 */
export async function fetchAgentSession(session: UserSession, agentId: string) {
  const client = getGraphQLClient()
  const { authAgentLogin } = await client.request(GraphQL.AuthAgentLoginDocument, {
    session,
    agentID: agentId,
  })
  return authAgentLogin
}

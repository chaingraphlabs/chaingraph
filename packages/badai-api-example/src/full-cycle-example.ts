/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import { print } from 'graphql'
import { createClient } from 'graphql-ws'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const restApiUrl = process.env.REST_API_URL ?? 'http://localhost:9151/graphql'
const wsApiUrl = process.env.WS_API_URL ?? 'ws://localhost:9151/graphql'
const agentId = process.env.AGENT_ID ?? ''

let activeSocket: WebSocket | null = null
let pingTimeout: ReturnType<typeof setTimeout> | null = null
let pongTimeout: ReturnType<typeof setTimeout> | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

const INITIAL_RECONNECT_DELAY = 1000 // 1 second
const MAX_RECONNECT_DELAY = 10000 // 10 seconds
const PING_INTERVAL = 10000 // 10 seconds
const PONG_TIMEOUT = 5000 // 5 seconds

console.log('Using REST API URL:', restApiUrl)
console.log('Using WS API URL:', wsApiUrl)

function createWsClient(url: string) {
  return createClient({
    url,
    retryAttempts: Infinity, // Infinite reconnection attempts
    shouldRetry: () => {
      // Clear any pending timeouts on connection failure
      if (pingTimeout) {
        clearTimeout(pingTimeout)
        pingTimeout = null
      }
      if (pongTimeout) {
        clearTimeout(pongTimeout)
        pongTimeout = null
      }

      // Always retry
      return true
    },
    retryWait: async (retries) => {
      // Exponential backoff with jitter
      const baseDelay = Math.min(
        INITIAL_RECONNECT_DELAY * 2 ** retries,
        MAX_RECONNECT_DELAY,
      )
      const jitter = Math.random() * 0.3 * baseDelay // 30% jitter
      const delay = Math.floor(baseDelay + jitter)

      // Wait for the calculated delay
      await new Promise<void>(resolve => setTimeout(resolve, delay))
    },
    keepAlive: PING_INTERVAL,
    on: {
      connected: (socket) => {
        console.log('[WS] Connected to server')
        activeSocket = socket as WebSocket

        // Clear any pending reconnection timeout
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout)
          reconnectTimeout = null
        }
      },
      connecting: () => {
        console.log('[WS] Connecting to server...')
      },
      closed: (event) => {
        console.log('[WS] Connection closed', event)
        activeSocket = null

        // Clear all timeouts
        if (pingTimeout) {
          clearTimeout(pingTimeout)
          pingTimeout = null
        }
        if (pongTimeout) {
          clearTimeout(pongTimeout)
          pongTimeout = null
        }
      },
      ping: (received) => {
        if (!received) {
          // Ping sent
          console.log('[WS] Ping sent')

          // Set timeout for pong response
          pongTimeout = setTimeout(() => {
            console.error('[WS] Pong timeout - closing connection')
            if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
              activeSocket.close(4408, 'Pong Timeout')
            }
          }, PONG_TIMEOUT)
        } else {
          // Ping received from server (rare but possible)
          console.log('[WS] Ping received from server')
        }
      },
      pong: (received) => {
        if (received) {
          console.log('[WS] Pong received')
          // Clear pong timeout
          if (pongTimeout) {
            clearTimeout(pongTimeout)
            pongTimeout = null
          }
        }
      },
      error: (error) => {
        console.error('[WS] Error:', error)
      },
    },
  })
}

async function main() {
  const restClient = createGraphQLClient(restApiUrl)
  const wsClient = createWsClient(wsApiUrl)

  const privateKey = generatePrivateKey()
  console.log('Private Key:', privateKey)

  const account = privateKeyToAccount(privateKey)
  console.log('Address:', account.address)
  console.log('Public Key:', account.publicKey)

  // Get the auth message from the server
  const { authMetamaskMessage } = await restClient.request(
    GraphQL.AuthMetamaskMessageDocument,
    {
      address: account.address,
    },
  )

  // Sign the message with the private key
  const signature = await account.signMessage({
    message: authMetamaskMessage,
  })

  console.log('Signature:', signature)

  // Send the signature to the server to get the auth token (JWT)
  const { authMetamaskLogin } = await restClient.request(
    GraphQL.AuthMetamaskLoginDocument,
    {
      input: {
        authMessage: authMetamaskMessage,
        sign: signature,
      },
    },
  )

  const session = authMetamaskLogin.session
  console.log('Session:', session)

  const userProfile = authMetamaskLogin.user_profile
  console.log('User Profile:', userProfile)

  // Create chat room:
  const { createChatRoom } = await restClient.request(
    GraphQL.CreateChatRoomDocument,
    {
      session,
      agents: [agentId],
    },
  )

  console.log('Chat Room:', createChatRoom)

  // subscribe to chat room messages
  let resolveMessageFinished: () => void
  const onMessageFinishedPromise = new Promise<void>((resolve) => {
    resolveMessageFinished = resolve
  })

  let agentResponse = ''

  const cancel = wsClient.subscribe(
    {
      query: print(GraphQL.SubscribeMessagesDocument),
      variables: {
        session,
        chat_id: createChatRoom.id,
        limitMessages: 100,
      },
    },
    {
      next: async ({ data }) => {
        // console.log('Subscription data:', JSON.stringify(data, null, 2))
        if (!data?.subscribeMessages)
          return

        const event = data.subscribeMessages as GraphQL.MessageEvent

        switch (event.event) {
          case GraphQL.Event.Subscribed: {
            // send message to the chat room from the user we just created
            console.log('Subscription confirmed, sending message...')
            const { sendMessage } = await restClient.request(
              GraphQL.SendMessageDocument,
              {
                session,
                chat_id: createChatRoom.id,
                message: {
                  is_system: false,
                  finished: true,
                  need_answer: true,
                  text: 'Find in the web the current weather in Paris.',
                },
              },
            )

            console.log('Sent Message:', sendMessage)
          }
            break

          case GraphQL.Event.MessageCreated:
            console.log(`Message Created by @${event.message?.participant?.username}: ${event.message?.text || '<no text>'} with version ${event.message?.version}`)
            break

          case GraphQL.Event.MessageDeltaAdd:
            if (event.message?.participant?.is_agent) {
              console.log(`Message Delta Add by @${event.message?.participant?.username} [${event.message?.version}]: ${event.message?.text}`)
            }
            break

          case GraphQL.Event.MessageFinished:
            if (event.message?.participant?.is_agent) {
              agentResponse = event.message.text
              resolveMessageFinished()
            }

            break
        }
      },
      error: (err) => {
        console.error('Subscription error:', err)
        resolveMessageFinished()
      },
      complete: () => {
        console.log('Subscription complete')
        resolveMessageFinished()
      },
    },
  )

  // Wait for MessageFinished event
  console.log('Waiting for MessageFinished event...')
  await onMessageFinishedPromise
  console.log('MessageFinished event received, shutting down gracefully...')

  console.log('\n\n--- Summary ---')
  console.log('Agent response:', agentResponse)

  // Clean up
  cancel()
  wsClient.dispose()

  // Gracefully exit
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

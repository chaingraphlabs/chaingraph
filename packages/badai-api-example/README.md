# @badaitech/badai-api-example

A comprehensive example demonstrating how to use the **@badaitech/badai-api** package for building AI-powered chat applications with real-time capabilities.

## Overview

The BadAI API provides a powerful GraphQL-based interface for creating conversational AI experiences. This example showcases the complete lifecycle of building a chat application with LLM agents, including authentication, chat room management, real-time messaging, and WebSocket subscriptions.

## Features

### 🔐 **Authentication & Security**
- **Wallet-based authentication** using Web3 standards (MetaMask/Ethereum signatures)
- **Session management** with JWT tokens
- **Secure message signing** using private keys

### 💬 **Chat Engine Capabilities**
- **Create and manage chat rooms** with multiple participants
- **Add AI agents** to conversations
- **Real-time message streaming** with WebSocket subscriptions
- **Message delta updates** for streaming LLM responses
- **System and user message differentiation**

### 🤖 **AI Agent Integration**
- **Deploy custom AI agents** with configurable parameters
- **Agent marketplace** for discovering and using community agents
- **Multi-agent conversations** with different roles and purposes
- **Tool integration** for agents (web search, code execution, etc.)
- **Token usage tracking** and cost management

### 🔄 **Real-time Features**
- **WebSocket subscriptions** for live updates
- **Message events**: created, delta updates, finished
- **Automatic reconnection** with exponential backoff
- **Connection health monitoring** with ping/pong

## Installation

### Important: NPM Registry Configuration

The `@badaitech` packages are hosted on GitHub Package Registry. You need to configure npm to use the correct registry for `@badaitech` scoped packages.

Create or update your `.npmrc` file in your project root:

```bash
@badaitech:registry=https://npm.pkg.github.com
```

Or configure globally:

```bash
npm config set @badaitech:registry https://npm.pkg.github.com
```

### Install Dependencies

```bash
# Using npm
npm install @badaitech/badai-api graphql graphql-ws viem

# Using yarn
yarn add @badaitech/badai-api graphql graphql-ws viem

# Using bun
bun add @badaitech/badai-api graphql graphql-ws viem
```

## Quick Start

### 1. Environment Setup

Create a `.env` file based on `.env.example`:

```env
REST_API_URL=https://api.badai.io/graphql
WS_API_URL=wss://api.badai.io/graphql-ws
AGENT_ID=your-agent-id-here
```

### 2. Basic Usage

```typescript
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import { createClient } from 'graphql-ws'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

// Initialize clients
const restClient = createGraphQLClient('https://api.badai.io/graphql')
const wsClient = createClient({ url: 'wss://api.badai.io/graphql-ws' })

// Generate wallet credentials
const privateKey = generatePrivateKey()
const account = privateKeyToAccount(privateKey)

// Authenticate
const { authMetamaskMessage } = await restClient.request(
  GraphQL.AuthMetamaskMessageDocument,
  { address: account.address }
)

const signature = await account.signMessage({ message: authMetamaskMessage })

const { authMetamaskLogin } = await restClient.request(
  GraphQL.AuthMetamaskLoginDocument,
  {
    input: {
      authMessage: authMetamaskMessage,
      sign: signature,
    }
  }
)

const session = authMetamaskLogin.session
```

## Core Concepts

### Authentication Flow

1. **Generate Wallet**: Create or use existing Ethereum wallet
2. **Request Auth Message**: Get a unique message from the server
3. **Sign Message**: Sign with private key to prove ownership
4. **Exchange for Session**: Trade signature for JWT session token

### Chat Room Lifecycle

1. **Create Room**: Initialize with optional AI agents
2. **Subscribe to Events**: Listen for real-time updates
3. **Send Messages**: User messages trigger AI responses
4. **Receive Streams**: Get token-by-token updates from LLMs
5. **Handle Completion**: Process final responses

### Message Events

- **`SUBSCRIBED`**: Connection established
- **`MESSAGE_CREATED`**: New message added to chat
- **`MESSAGE_DELTA_ADD`**: Streaming token from LLM
- **`MESSAGE_FINISHED`**: Complete response received
- **`MESSAGE_DELETED`**: Message removed
- **`MESSAGE_EDITED`**: Message content updated

## API Reference

### Core Types

#### Session Management
```typescript
type Session = string // JWT token
type UserProfile = {
  id: UserID
  email: string
  name: string
  role: UserRole
  tariffCurrent: UserTariff
}
```

#### Chat Entities
```typescript
type ChatRoom = {
  id: ChatID
  name: string
  participants: Participant[]
  created_at: Time
  last_message: Message
}

type Message = {
  id: MessageID
  text: string
  author: ParticipantID
  chat_id: ChatID
  finished: boolean
  is_system: boolean
  need_answer: boolean
  participant: Participant
  time: Time
  version: number
}
```

#### Agent Configuration
```typescript
type AgentMeta = {
  agent_id: AgentID
  username: string
  first_name: string
  last_name: string
  avatar: string
  role: string
  can_answer: boolean
  deployment_status: DeploymentStatus
}
```

### Key Operations

#### Creating a Chat Room
```typescript
const { createChatRoom } = await restClient.request(
  GraphQL.CreateChatRoomDocument,
  {
    session,
    agents: [agentId1, agentId2], // Optional AI agents
  }
)
```

#### Subscribing to Messages
```typescript
wsClient.subscribe(
  {
    query: print(GraphQL.SubscribeMessagesDocument),
    variables: {
      session,
      chat_id: chatRoomId,
      limitMessages: 100,
    }
  },
  {
    next: ({ data }) => {
      const event = data.subscribeMessages
      switch (event.event) {
        case GraphQL.Event.MessageDeltaAdd:
          console.log('New token:', event.message.text)
          break
        case GraphQL.Event.MessageFinished:
          console.log('Complete response:', event.message.text)
          break
      }
    }
  }
)
```

#### Sending Messages
```typescript
const { sendMessage } = await restClient.request(
  GraphQL.SendMessageDocument,
  {
    session,
    chat_id: chatRoomId,
    message: {
      text: "What's the weather like?",
      finished: true,
      need_answer: true,
      is_system: false,
    }
  }
)
```

## WebSocket Connection Management

The example includes robust WebSocket handling with:

- **Automatic reconnection** with exponential backoff
- **Connection health monitoring** via ping/pong
- **Graceful error handling** and recovery
- **Event-driven architecture** for state management

```typescript
const wsClient = createClient({
  url: wsApiUrl,
  retryAttempts: Infinity,
  shouldRetry: () => true,
  retryWait: async (retries) => {
    const delay = Math.min(1000 * 2 ** retries, 10000)
    await new Promise(resolve => setTimeout(resolve, delay))
  },
  keepAlive: 10000, // 10 second ping interval
  on: {
    connected: () => console.log('Connected'),
    closed: () => console.log('Disconnected'),
    error: (err) => console.error('Error:', err),
  }
})
```

## Running the Example

```bash
# Install dependencies
bun install

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the example
bun run src/full-cycle-example.ts
```

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│   Client App    │◄────────┤  @badaitech/     │
│                 │         │   badai-api      │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         │ GraphQL + WebSocket       │
         ▼                           ▼
┌─────────────────────────────────────────────┐
│            BadAI Platform                   │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Auth    │  │   Chat   │  │    LLM   │  │
│  │  Service  │  │  Engine  │  │  Agents  │  │
│  └───────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │         Knowledge Base (KDB)          │  │
│  │  Documents, Q&A, Embeddings, Search   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Best Practices

1. **Session Management**
   - Store sessions securely
   - Implement token refresh logic
   - Handle session expiration gracefully

2. **Error Handling**
   - Wrap API calls in try-catch blocks
   - Implement retry logic for transient failures
   - Log errors for debugging

3. **Performance Optimization**
   - Use subscriptions for real-time updates
   - Batch operations when possible
   - Implement pagination for large datasets

4. **Security**
   - Never expose private keys
   - Use environment variables for sensitive data
   - Validate all user inputs

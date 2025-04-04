# @badaitech/chaingraph-trpc

![License](https://img.shields.io/badge/license-BUSL-blue.svg)

A type-safe tRPC layer for the ChainGraph flow-based programming framework. This package provides end-to-end type safety between client and server, real-time subscriptions via WebSockets, and a robust API for flow management, node registration, and execution control.

## Overview

`@badaitech/chaingraph-trpc` serves as the communication backbone of ChainGraph, enabling:

- **Type-Safe APIs**: Complete end-to-end type safety using tRPC and SuperJSON
- **Real-Time Updates**: WebSocket-based subscriptions for flow and execution events
- **Flow Management**: Create, retrieve, update, and delete flows
- **Node Operations**: Register, discover, and instantiate computational nodes
- **Execution Control**: Start, stop, pause, and monitor flow executions
- **Storage Integration**: Support for both in-memory and PostgreSQL persistence
- **Debugging Tools**: Breakpoints, stepping, and execution monitoring

## Installation

```bash
# Before installing, make sure you have set up authentication for GitHub Packages
npm install @badaitech/chaingraph-trpc
# or
yarn add @badaitech/chaingraph-trpc
# or
pnpm add @badaitech/chaingraph-trpc
```

## Authentication for GitHub Packages

To use this package, you need to configure npm to authenticate with GitHub Packages:

1. Create a personal access token (PAT) with the `read:packages` scope on GitHub.
2. Add the following to your project's `.npmrc` file or to your global `~/.npmrc` file:

```
@badaitech:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Replace `YOUR_GITHUB_PAT` with your actual GitHub personal access token.

## Usage

### Client Setup

```typescript
import { trpcClient, trpcReact, queryClient } from '@badaitech/chaingraph-trpc/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

function App() {
  // Set up WebSocket connection
  const [trpc] = useState(() => trpcReact.createClient({
    links: [
      wsLink({
        client: createWSClient({
          url: 'ws://localhost:3001',
        }),
      }),
    ],
  }))

  return (
    <trpcReact.Provider client={trpc} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <YourApplication />
      </QueryClientProvider>
    </trpcReact.Provider>
  )
}
```

### Server Setup

```typescript
import { init, applyWSSHandler, appRouter, createContext } from '@badaitech/chaingraph-trpc/server'
import { WebSocketServer } from 'ws'

// Initialize tRPC context and stores
await init()

// Create WebSocket server
const wss = new WebSocketServer({ port: 3001 })
const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
})

console.log('WebSocket Server listening on ws://localhost:3001')
```

### Working with Flows

```typescript
// Client-side example
import { trpcClient } from '@badaitech/chaingraph-trpc/client'

// Create a new flow
const createFlow = async () => {
  const flow = await trpcClient.flow.create.mutate({
    name: 'My Flow',
    description: 'A flow for processing data',
    tags: ['demo', 'processing'],
  })
  return flow
}

// Add a node to a flow
const addNode = async (flowId, nodeType) => {
  const node = await trpcClient.flow.addNode.mutate({
    flowId,
    nodeType,
    position: { x: 100, y: 100 },
  })
  return node
}

// Connect node ports
const connectPorts = async (flowId, sourceNodeId, targetNodeId) => {
  const edge = await trpcClient.flow.connectPorts.mutate({
    flowId,
    sourceNodeId,
    sourcePortId: 'output',
    targetNodeId,
    targetPortId: 'input',
  })
  return edge
}

// Subscribe to flow events
const subscribeToFlowEvents = async (flowId) => {
  const subscription = trpcClient.flow.subscribeToEvents.subscribe(
    { flowId },
    {
      onData: (event) => console.log('Flow event:', event),
      onError: (err) => console.error('Subscription error:', err),
    }
  )
  return subscription
}
```

### Executing Flows

```typescript
// Create execution instance
const createExecution = async (flowId) => {
  const execution = await trpcClient.execution.create.mutate({
    flowId,
    options: {
      debug: true, // Enable debugging features
    },
  })
  return execution
}

// Start execution
const startExecution = async (executionId) => {
  await trpcClient.execution.start.mutate({ executionId })
}

// Subscribe to execution events
const subscribeToExecutionEvents = async (executionId) => {
  const subscription = trpcClient.execution.subscribeToEvents.subscribe(
    { executionId },
    {
      onData: (event) => console.log('Execution event:', event),
      onError: (err) => console.error('Subscription error:', err),
    }
  )
  return subscription
}

// Add breakpoint for debugging
const addBreakpoint = async (executionId, nodeId) => {
  await trpcClient.execution.debug.addBreakpoint.mutate({
    executionId,
    nodeId,
  })
}

// Step through execution (when paused at breakpoint)
const stepExecution = async (executionId) => {
  await trpcClient.execution.debug.step.mutate({ executionId })
}
```

### Exploring Available Nodes

```typescript
// Get all nodes categorized
const getCategorizedNodes = async () => {
  const categories = await trpcClient.nodeRegistry.getCategorizedNodes.query()
  return categories
}

// Search for nodes
const searchNodes = async (query) => {
  const results = await trpcClient.nodeRegistry.searchNodes.query(query)
  return results
}

// Get nodes for a specific category
const getNodesByCategory = async (categoryId) => {
  const category = await trpcClient.nodeRegistry.getNodesByCategory.query(categoryId)
  return category
}
```

## API Reference

The package exports two main entry points:

### Client API (`@badaitech/chaingraph-trpc/client`)

- `trpcReact`: React hooks for tRPC queries and mutations
- `trpcClient`: Direct client for non-React environments
- `queryClient`: Configured TanStack Query client
- Types: `RouterInputs`, `RouterOutputs`, and more

### Server API (`@badaitech/chaingraph-trpc/server`)

- `appRouter`: Main tRPC router with all procedures
- `createContext`: Context factory for tRPC requests
- `init`: Initialize backend systems (node registry, stores, etc.)
- `applyWSSHandler`: Setup WebSocket handler for tRPC

## Key Components

### Flow Procedures

- `create`: Create a new flow
- `get`: Get a flow by ID
- `list`: List all flows
- `delete`: Delete a flow
- `addNode`: Add a node to a flow
- `removeNode`: Remove a node from a flow
- `connectPorts`: Connect ports between nodes
- `removeEdge`: Remove an edge
- `updateNodePosition`: Update node position
- `updatePortValue`: Update port value
- `subscribeToEvents`: Subscribe to flow events

### Execution Procedures

- `create`: Create an execution instance
- `start`: Start execution
- `stop`: Stop execution
- `pause`: Pause execution
- `resume`: Resume execution
- `getState`: Get execution state
- `subscribeToEvents`: Subscribe to execution events
- Debug operations:
    - `addBreakpoint`: Add a breakpoint
    - `removeBreakpoint`: Remove a breakpoint
    - `step`: Step execution
    - `getBreakpoints`: Get all breakpoints

### Node Registry Procedures

- `getCategorizedNodes`: Get all nodes grouped by categories
- `searchNodes`: Search nodes by query
- `getNodesByCategory`: Get nodes for a specific category
- `getCategories`: Get all categories
- `getNodeType`: Get a specific node type information

## Database Support

ChainGraph tRPC supports two storage mechanisms:

1. **In-Memory Store**: Default storage option, suitable for development
2. **PostgreSQL Store**: Persistent storage for production environments

To use PostgreSQL, set the `DATABASE_URL` environment variable:

```
DATABASE_URL=postgres://username:password@localhost:5432/dbname
```

Run migrations to set up the database schema:

```bash
pnpm run migrate
```

## License

BUSL-1.1 - Business Source License

## Related Packages

- **@badaitech/chaingraph-types**: Core type definitions and decorators
- **@badaitech/chaingraph-frontend**: Frontend components for visual flow programming
- **@badaitech/chaingraph-backend**: Backend services for flow execution
- **@badaitech/chaingraph-nodes**: Collection of pre-built nodes
---
name: trpc-patterns
description: tRPC framework patterns and best practices for type-safe APIs. Use when working with tRPC routers, procedures, subscriptions, middleware, or client setup. Covers WebSocket subscriptions, Zod validation, error handling, context creation. Triggers: trpc, router, procedure, subscription, publicProcedure, middleware, createTRPCRouter, wsLink, createWSClient, TRPCError, zod input, initTRPC.
---

# tRPC Patterns for ChainGraph

This skill covers tRPC framework patterns used across ChainGraph. These patterns are applicable to any tRPC project.

## Core Setup

### tRPC Initialization

**File**: `packages/chaingraph-trpc/server/trpc.ts:15-46`

```typescript
import { initTRPC, TRPCError } from '@trpc/server'
import SuperJSON from 'superjson'
import { ZodError } from 'zod'

const t = initTRPC
  .context<Context>()
  .create({
    // SuperJSON for advanced serialization (Date, Map, Set, BigInt)
    transformer: SuperJSON,

    // Custom error formatter for Zod validation errors
    errorFormatter(opts) {
      const { shape, error } = opts
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
              ? error.cause.flatten()
              : null,
        },
      }
    },

    // SSE configuration for subscriptions
    isDev: true,
    sse: {
      maxDurationMs: 5 * 60 * 1_000,  // 5 minutes max
      ping: {
        enabled: true,
        intervalMs: 3_000,  // 3 second ping
      },
      client: {
        reconnectAfterInactivityMs: 5_000,
      },
    },
  })

// Export builders
export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory
```

---

## Middleware Chain

ChainGraph uses layered middleware for authentication:

```
publicProcedure (base)
    │
    ├─► authedProcedure (requires auth)
    │       │
    │       ├─► adminProcedure (requires admin role)
    │       │
    │       └─► flowContextProcedure (domain-specific)
    │
    └─► (other domain procedures)
```

### publicProcedure

No authentication required. Base for all other procedures.

```typescript
export const publicProcedure = t.procedure
```

### authedProcedure

**File**: `packages/chaingraph-trpc/server/trpc.ts:52-72`

```typescript
export const authedProcedure = publicProcedure.use(async (opts) => {
  const { ctx } = opts

  // Dev mode bypass
  if (!authConfig.enabled || authConfig.devMode) {
    return opts.next()
  }

  // Check authentication
  if (!ctx.session.isAuthenticated) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.session.user,  // Extend context
    },
  })
})
```

### adminProcedure

**File**: `packages/chaingraph-trpc/server/trpc.ts:74-91`

```typescript
export const adminProcedure = authedProcedure.use(async (opts) => {
  const { ctx } = opts

  if (authConfig.devMode) {
    return opts.next()
  }

  if (ctx.session.user?.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    })
  }

  return opts.next()
})
```

### Domain-Specific Middleware

**File**: `packages/chaingraph-trpc/server/trpc.ts:93-147`

```typescript
// Extract input BEFORE procedure runs
export const flowContextProcedure = authedProcedure.use(async (opts) => {
  const rawInput = await opts.getRawInput()

  // Extract flowId from any input shape
  const flowId: string | null = rawInput
    && typeof rawInput === 'object'
    && 'flowId' in rawInput
    && typeof rawInput.flowId === 'string'
    ? rawInput.flowId
    : null

  if (!flowId) {
    throw new Error('Parameter flowId is required for this procedure')
  }

  // Check resource-level access
  if (!await ctx.flowStore.hasAccess(flowId, ctx.session.user.id)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User does not have access to this flow',
    })
  }

  return opts.next(opts)
})
```

---

## Procedure Types

### Query (Read Operations)

```typescript
export const get = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
  }))
  .query(async ({ input, ctx }) => {
    const flow = await ctx.flowStore.getFlow(input.flowId)
    if (!flow) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Flow ${input.flowId} not found`,
      })
    }
    return flow
  })
```

### Mutation (Write Operations)

```typescript
export const create = authedProcedure
  .input(z.object({
    name: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const flow = await ctx.flowStore.createFlow({
      name: input.name,
      description: input.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: input.tags,
      ownerID: userId,
    })

    return flow.metadata
  })
```

### Subscription (Real-time)

**File**: `packages/chaingraph-trpc/server/procedures/flow/subscriptions.ts:25-132`

```typescript
import { tracked } from '@trpc/server'
import { zAsyncIterable } from '../subscriptions/utils/zAsyncIterable'

export const subscribeToEvents = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    eventTypes: z.array(z.nativeEnum(FlowEventType)).optional(),
    lastEventId: z.string().nullish(),  // For resumption
  }))
  .output(zAsyncIterable({
    yield: z.custom<FlowEvent>(),
    tracked: true,  // Enable event tracking
  }))
  .subscription(async function* ({ input, ctx }) {
    const { flowId, eventTypes, lastEventId } = input
    const flow = await ctx.flowStore.getFlow(flowId)

    if (!flow) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Flow with ID ${flowId} not found`,
      })
    }

    let eventIndex = Number(lastEventId) || 0
    const eventQueue = new EventQueue<FlowEvent>(1000)

    try {
      // Subscribe to future events
      const unsubscribe = flow.onEvent(async (event) => {
        if (!isAcceptedEventType(eventTypes, event.type)) {
          return
        }
        await eventQueue.publish(event)
      })

      // Send initial state
      yield tracked(String(eventIndex++), {
        type: FlowEventType.FlowInitStart,
        flowId,
        metadata: flow.metadata,
      })

      // Stream events from queue
      const iterator = createQueueIterator(eventQueue)
      for await (const event of iterator) {
        yield tracked(String(eventIndex++), event)
      }
    } finally {
      // Cleanup
      await eventQueue.close()
    }
  })
```

**Key Pattern**: `tracked(id, event)` enables:
- Event ID tracking for resumption
- Client can pass `lastEventId` to resume from disconnection

---

## Input Validation with Zod

### Simple Input

```typescript
.input(z.object({
  flowId: z.string(),
}))
```

### Complex Input with Validation

```typescript
.input(z.object({
  flowId: z.string(),
  nodeType: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  portsConfig: z.map(z.string(), z.any()).optional(),
}))
```

### Zod Error Extraction

Errors automatically include Zod details via `errorFormatter`:

```typescript
// Client receives:
{
  code: 'BAD_REQUEST',
  data: {
    zodError: {
      fieldErrors: { flowId: ['Required'] },
      formErrors: []
    }
  }
}
```

---

## Context Creation

**File**: `packages/chaingraph-trpc/server/context.ts`

### Context Interface

```typescript
export interface AppContext {
  session: Session
  db: DBType
  flowStore: IFlowStore
  nodeRegistry: NodeRegistry
  nodesCatalog: NodeCatalog
  mcpStore: IMCPStore
  userStore: UserStore
}

interface Session {
  user?: User
  session?: SessionData
  isAuthenticated: boolean
}
```

### Initialization (Once at Startup)

```typescript
export function initializeContext(
  _db: DBType,
  _flowStore: IFlowStore,
  _nodeRegistry: NodeRegistry,
  _nodesCatalog: NodeCatalog,
  _mcpStore: IMCPStore,
  _userStore: UserStore,
) {
  db = _db
  flowStore = _flowStore
  nodeRegistry = _nodeRegistry
  nodesCatalog = _nodesCatalog
  mcpStore = _mcpStore
  userStore = _userStore
  authService = new AuthService(_userStore)
}
```

### Per-Request Context

```typescript
export async function createContext(opts: CreateHTTPContextOptions): Promise<AppContext> {
  if (!db || !flowStore) {
    throw new Error('Context not initialized. Call initializeContext first.')
  }

  const token = getAuthToken(opts)
  const session = await authService.validateSession(token)
  const user = await authService.getUserFromSession(session)

  return {
    session: {
      user: user ?? undefined,
      session: session ?? undefined,
      isAuthenticated: !!user && !!session,
    },
    db,
    flowStore,
    nodeRegistry,
    nodesCatalog,
    mcpStore,
    userStore,
  }
}
```

### Auth Token Extraction

```typescript
export function getAuthToken(opts: CreateHTTPContextOptions): string | undefined {
  // Try WebSocket connection params
  if (opts.info.connectionParams?.sessionBadAI) {
    return opts.info.connectionParams.sessionBadAI
  }

  // Try Authorization header
  if (opts.req.headers.authorization) {
    const [scheme, token] = opts.req.headers.authorization.split(' ')
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token
    }
  }

  // Try cookie
  const cookies = opts.req.headers.cookie
  if (cookies) {
    const match = cookies.match(/session=([^;]+)/)
    if (match && match[1]) {
      return match[1]
    }
  }

  return undefined
}
```

---

## Error Handling

### TRPCError Codes

| Code | HTTP Status | Usage |
|------|-------------|-------|
| `UNAUTHORIZED` | 401 | Not logged in |
| `FORBIDDEN` | 403 | No permission |
| `NOT_FOUND` | 404 | Resource missing |
| `BAD_REQUEST` | 400 | Invalid input |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

### Usage Examples

```typescript
// Not authenticated
throw new TRPCError({ code: 'UNAUTHORIZED' })

// No permission
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'Admin access required',
})

// Resource not found
throw new TRPCError({
  code: 'NOT_FOUND',
  message: `Execution with id ${id} not found`,
})

// Invalid operation
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: `Cannot stop execution in status ${status}`,
})
```

---

## WebSocket Client

**File**: `packages/chaingraph-trpc/client/trpc.ts`

```typescript
import { createTRPCClient } from '@trpc/client'
import { createWSClient, wsLink } from '@trpc/client/links/wsLink'

export function createTRPCClient(opts: {
  url: string
  superjsonCustom?: typeof SuperJSON
  auth?: { sessionBadAI?: string }
  wsClientCallbacks?: {
    onOpen?: () => void
    onError?: (err?: Event) => void
    onClose?: (cause?: { code?: number }) => void
  }
}) {
  const token = opts.auth?.sessionBadAI || undefined

  return _createTRPCClient<AppRouter>({
    links: [
      wsLink<AppRouter>({
        transformer: opts?.superjsonCustom ?? SuperJSON,
        client: createWSClient({
          url: opts.url,
          connectionParams: {
            sessionBadAI: token,  // Auth token in connection params
          },
          onOpen: () => opts.wsClientCallbacks?.onOpen?.(),
          onError: (event) => opts.wsClientCallbacks?.onError?.(event),
          onClose: (cause) => opts.wsClientCallbacks?.onClose?.(cause),
          keepAlive: {
            enabled: true,
            intervalMs: 5000,
            pongTimeoutMs: 3000,
          },
        }),
      }),
    ],
  })
}
```

### React Integration

```typescript
import { createTRPCContext } from '@trpc/tanstack-react-query'

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>()

// Usage in components
function MyComponent() {
  const { data, isLoading } = useTRPC.flow.list.useQuery()
  const mutation = useTRPC.flow.create.useMutation()

  // Subscription
  useTRPC.flow.subscribeToEvents.useSubscription(
    { flowId },
    { onData: (event) => handleEvent(event) }
  )
}
```

---

## WebSocket Server

**File**: `packages/chaingraph-executor/server/ws-server.ts`

```typescript
import { WebSocketServer } from 'ws'
import { applyWSSHandler } from '@trpc/server/adapters/ws'

export function createWSServer(port: number, host: string) {
  // HTTP server for health checks
  const httpServer = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/healthz' || req.url === '/ready') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
      }))
      return
    }
    res.writeHead(404)
    res.end('Not Found')
  })

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer })

  httpServer.listen(port, host)

  // Apply tRPC handler
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext,
    keepAlive: {
      enabled: true,
      pingMs: 5000,
      pongWaitMs: 10000,
    },
  })

  // Connection tracking
  wss.on('connection', (ws) => {
    console.log(`+ Connection (${wss.clients.size})`)
    ws.once('close', () => {
      console.log(`- Connection (${wss.clients.size})`)
    })
  })

  // Graceful shutdown
  const shutdown = () => {
    handler.broadcastReconnectNotification()
    wss.close()
    httpServer.close()
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  return { wss, httpServer, handler, shutdown }
}
```

---

## Router Composition

**File**: `packages/chaingraph-trpc/server/router.ts`

```typescript
import { router, createCallerFactory } from './trpc'

export const appRouter = router({
  flow: flowProcedures,      // Flow editing
  edge: edgeProcedures,      // Edge-specific
  nodeRegistry: nodeRegistryProcedures,
  secrets: secretProcedures,
  mcp: mcpProcedures,
  users: userProcedures,
})

// Type export for client
export type AppRouter = typeof appRouter

// Server-side caller (for testing/internal use)
export const createCaller = createCallerFactory(appRouter)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/chaingraph-trpc/server/trpc.ts` | Core initialization & middleware |
| `packages/chaingraph-trpc/server/context.ts` | Context creation & auth |
| `packages/chaingraph-trpc/server/router.ts` | Router composition |
| `packages/chaingraph-trpc/client/trpc.ts` | Client setup |
| `packages/chaingraph-executor/server/ws-server.ts` | WebSocket server |

---

## Quick Reference

| Need | Pattern |
|------|---------|
| Add middleware | `.use(async (opts) => { ... opts.next() })` |
| Extract raw input | `await opts.getRawInput()` |
| Extend context | `opts.next({ ctx: { ...ctx, newProp } })` |
| Track subscription events | `yield tracked(id, event)` |
| Resume subscription | Input `lastEventId`, resume from that point |
| Error with code | `throw new TRPCError({ code: 'NOT_FOUND', message })` |
| Auth in WebSocket | `connectionParams: { sessionBadAI: token }` |
| Health check | HTTP endpoint on same server as WebSocket |

---

## Related Skills

- `trpc-flow-editing` - Flow editing procedures
- `trpc-execution` - Execution procedures
- `subscription-sync` - Real-time data synchronization

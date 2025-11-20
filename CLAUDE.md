# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ChainGraph is a flow-based programming framework for building visual computational graphs. It's a **pnpm monorepo** using **Turbo** for task orchestration, **TypeScript** throughout, and **Bun** as the development runtime.

## Project Structure

### Applications (apps/)
- **chaingraph-backend**: Legacy tRPC server (in-memory/simple storage)
- **chaingraph-frontend**: React+Vite visual flow editor using XYFlow
- **chaingraph-execution-api**: Scalable tRPC API server for execution management
- **chaingraph-execution-worker**: Worker service for processing flow executions

### Core Packages (packages/)
- **chaingraph-types**: Foundation package with port system, decorators, base node classes, flow definitions
- **chaingraph-nodes**: Pre-built node implementations (AI, flow control, data manipulation, etc.)
- **chaingraph-trpc**: tRPC layer with real-time subscriptions (WebSocket), database schemas (Drizzle ORM)
- **chaingraph-executor**: **THE EXECUTION ENGINE** - Contains DBOS workflows, execution services, event streaming
- **chaingraph-channel**: Internal communication abstractions
- **badai-api**: BadAI platform integration (GraphQL client)

### Supporting Packages
- **chaingraph-codegen**: Code generation utilities for type definitions
- **chaingraph-formal-spec**: Formal specifications and documentation
- **typescript-config**: Shared TypeScript configurations

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Run all services (frontend + backend/execution-api)
pnpm run dev

# Run individual services
pnpm run dev:front              # Frontend only
pnpm run dev:back               # Backend only
pnpm run dev:execution-worker   # Execution worker only

# Build everything
pnpm run build

# Build specific apps
pnpm run build:front
pnpm run build:back
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui

# Run specific package tests
pnpm --filter @badaitech/chaingraph-types test
pnpm --filter @badaitech/chaingraph-executor test
```

### Code Quality
```bash
# Type check all packages
pnpm run typecheck

# Lint
pnpm run lint

# Lint and auto-fix
pnpm run lint:fix
```

### Database Management
```bash
# Start PostgreSQL (Docker)
docker compose up -d postgres

# Run migrations (creates schema in PostgreSQL)
pnpm run migrate

# Generate new migration (after schema changes)
DATABASE_URL="postgres://postgres@0.0.0.0:5432/postgres?sslmode=disable" npm run migrate:generate
```

### Docker
```bash
# Build Docker images
pnpm run docker:backend
pnpm run docker:frontend
pnpm run docker:execution-api
pnpm run docker:execution-worker
pnpm run docker:build-all

# Or use Makefile
make docker-build-backend
make docker-build-frontend
make docker-build-all

# Run with docker-compose
make docker-compose-up
make docker-compose-down
```

## High-Level Architecture

### The Two Execution Modes

ChainGraph supports two execution architectures controlled by `ENABLE_DBOS_EXECUTION` environment variable:

#### 1. DBOS Mode (Production, Recommended)
Uses **DBOS (Database-Oriented Operating System)** for durable, exactly-once execution:

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React + XYFlow)                                   │
│  └─> tRPC Client                                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ Execution API (tRPC Server)                                 │
│  ├─ create() → Start DBOS workflow                          │
│  ├─ start() → Send START_SIGNAL                             │
│  ├─ subscribeToExecutionEvents() → DBOS streams             │
│  └─ pause/resume/stop() → DBOS messaging                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ DBOS Runtime (chaingraph-executor)                          │
│  ├─ ExecutionWorkflow (main orchestration)                  │
│  │   ├─ Phase 1: Stream init + signal wait                  │
│  │   ├─ Phase 2: Execute flow (3 durable steps)             │
│  │   └─ Phase 3: Spawn children                             │
│  │                                                           │
│  ├─ ExecuteFlowAtomicStep (THE CORE STEP)                   │
│  │   ├─ Load flow from DB                                   │
│  │   ├─ Create ExecutionEngine instance                     │
│  │   ├─ Execute nodes (with command polling)                │
│  │   ├─ Stream events via DBOS.writeStream()                │
│  │   └─ Collect child tasks (Event Emitter nodes)           │
│  │                                                           │
│  └─ PostgreSQL                                              │
│      ├─ DBOS system tables (workflow state)                 │
│      ├─ Execution data (flows, nodes, events)               │
│      └─ Event streams (real-time subscriptions)             │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- **Exactly-once execution** via DBOS workflow IDs
- **Automatic recovery** from failures via checkpoints
- **Real-time event streaming** via PostgreSQL
- **No Kafka dependency** for core execution
- Events written from step = at-least-once semantics (may duplicate on retry)
- Child executions auto-start (no manual start call needed)

**Critical Files:**
- `packages/chaingraph-executor/server/dbos/workflows/ExecutionWorkflow.ts` - Main orchestration
- `packages/chaingraph-executor/server/dbos/steps/ExecuteFlowAtomicStep.ts` - Core execution
- `packages/chaingraph-executor/server/dbos/README.md` - Complete DBOS documentation

#### 2. Legacy Kafka Mode
Original architecture using Kafka for task distribution (being phased out).

### Node System Architecture

ChainGraph uses **TypeScript decorators** for defining visual programming nodes:

```typescript
@Node({
  title: 'Example Node',
  description: 'Does something',
  category: 'math',
})
class ExampleNode extends BaseNode {
  @Input()
  @Number({ defaultValue: 0 })
  inputValue: number = 0;

  @Output()
  @String()
  result: string = '';

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.result = `Processed: ${this.inputValue}`;
    return {};
  }
}
```

**Port Types:**
- Primitives: `@String()`, `@Number()`, `@Boolean()`
- Complex: `@PortArray()`, `@PortObject()`, `@PortStream()`
- Special: `@StringEnum()`, `@NumberEnum()`, `@PortEnumFromNative()`
- Dynamic: `@PortVisibility()` for conditional visibility

**Port System:**
- Lazy instantiation + caching for memory efficiency
- Runtime validation via Zod schemas
- Serialization via SuperJSON
- Type-safe connections validated at compile and runtime

### Execution Engine Flow

```
Flow Definition (JSON)
  ├─> Deserialized into Flow instance
  ├─> Nodes instantiated via NodeRegistry
  ├─> Ports initialized with configurations
  └─> ExecutionEngine orchestrates execution
      ├─> Dependency resolution (topological sort)
      ├─> Parallel execution where possible
      ├─> Event propagation (node status, port updates)
      └─> Debugging support (breakpoints, step-over)
```

### State Management

- **Frontend**: Effector for reactive state management
- **Backend**: PostgreSQL (Drizzle ORM) for persistence
- **Real-time**: WebSocket subscriptions via tRPC
- **Optimistic Updates**: Effector stores handle optimistic UI updates

## Key Technologies

### Core Stack
- **TypeScript**: Decorators (`experimentalDecorators`, `emitDecoratorMetadata`), advanced types
- **Bun**: Runtime for development (use `--conditions=development` for debugging)
- **Node.js v22.14.0**: Production runtime
- **pnpm**: Package manager with workspaces
- **Turbo**: Monorepo task orchestration

### Backend
- **tRPC**: End-to-end type-safe APIs with WebSocket support
- **DBOS SDK**: Durable execution framework (`@dbos-inc/dbos-sdk`)
- **Drizzle ORM**: Type-safe database toolkit
- **PostgreSQL**: Primary data store
- **Zod**: Runtime schema validation
- **SuperJSON**: Advanced serialization (handles Date, Map, Set, BigInt, etc.)

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **XYFlow**: Visual flow editor library
- **Effector**: Reactive state management
- **TanStack Query**: Server state management (via tRPC)

### Testing
- **Vitest**: Test runner with coverage
- **TypeScript**: Type checking in tests

## Important Patterns

### DBOS Workflow Constraints

**CRITICAL**: DBOS has strict rules about where context methods can be called:

```typescript
// ✅ From WORKFLOW functions: All DBOS methods allowed
async function myWorkflow(task: Task): Promise<Result> {
  await DBOS.send(...)           // ✅
  await DBOS.recv(...)           // ✅
  await DBOS.startWorkflow(...)  // ✅
  await DBOS.writeStream(...)    // ✅

  const result = await DBOS.runStep(() => myStep(task))  // ✅
  return result
}

// ✅ From STEP functions: ONLY writeStream() allowed
async function myStep(task: Task): Promise<StepResult> {
  await DBOS.writeStream(...)    // ✅ ONLY THIS ONE!

  // ❌ NOT ALLOWED:
  // await DBOS.send(...)        // ❌ Error!
  // await DBOS.recv(...)        // ❌ Error!
  // await DBOS.startWorkflow(...) // ❌ Error!

  return { data: ... }
}
```

**Workarounds:**
- **Messaging**: Workflow polls `DBOS.recv()`, updates shared state (CommandController)
- **Child spawning**: Step collects child tasks, workflow spawns via `DBOS.startWorkflow()`
- **Streaming**: Use `DBOS.writeStream()` from steps (allowed!)

### Signal Pattern (Race Condition Fix)

Solves the problem where clients subscribe to events before the stream exists:

```
1. create execution (tRPC)
   └─ Workflow starts → writes EXECUTION_CREATED → stream exists! ✅
   └─ Workflow waits for START_SIGNAL... ⏸️

2. subscribe events (tRPC)
   └─ Stream already exists → immediately receives EXECUTION_CREATED ✅

3. start execution (tRPC)
   └─ Sends START_SIGNAL → workflow continues ▶️
```

### Child Execution Pattern

Event Emitter nodes create child executions:

```
Parent execution:
  ├─ Event Emitter node executes
  ├─ context.emitEvent('event-name', data)
  ├─ Step collects child tasks
  ├─ Step returns { childTasks: [...] }
  └─ Workflow spawns children via DBOS.startWorkflow()

Child execution:
  ├─ Auto-starts (sends START_SIGNAL to self) 🚀
  ├─ Writes own EXECUTION_CREATED event
  ├─ Executes independently
  └─ Can spawn grandchildren (up to depth 100)
```

### Port Storage System

Ports use a unified storage system for memory efficiency:

- **Lazy instantiation**: Ports created only when accessed
- **Caching**: Instances cached per configuration
- **Unified registry**: Single registry for all port types
- **Type safety**: Full TypeScript inference

## Development Workflow

### Adding a New Node

1. Create node class in `packages/chaingraph-nodes/src/nodes/`
2. Use decorators for metadata and ports
3. Implement `execute()` method
4. Register in appropriate category file
5. Export from `index.ts`

Example location: `packages/chaingraph-nodes/src/nodes/math/addition.node.ts`

### Modifying Database Schema

1. Update schema in `packages/chaingraph-trpc/src/server/db/schema.ts`
2. Generate migration: `pnpm run migrate:generate` (in chaingraph-trpc package)
3. Run migration: `pnpm run migrate`
4. Update TypeScript types if needed

### Testing Execution

For execution-related tests:
```bash
# Test specific execution test
pnpm --filter @badaitech/chaingraph-executor test server/dbos/__tests__/execution-e2e.test.ts

# Run with timeout for long tests
timeout 60 npx vitest run server/dbos/__tests__/execution-e2e.test.ts --no-coverage
```

### Debugging with Bun

Use `--conditions=development` flag to debug TypeScript source directly:
```bash
bun --conditions=development --watch run src/index.ts
```

This enables debugging without relying on source maps.

## Environment Configuration

### Development
```bash
# Core
NODE_ENV=development

# Database
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable
DATABASE_URL_EXECUTIONS=postgres://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable

# DBOS Execution (recommended)
ENABLE_DBOS_EXECUTION=true
DBOS_SYSTEM_DATABASE_URL=postgres://postgres@localhost:5432/chaingraph
DBOS_ADMIN_ENABLED=true
DBOS_ADMIN_PORT=3022
DBOS_QUEUE_CONCURRENCY=100
DBOS_WORKER_CONCURRENCY=5

# Execution Mode (if not using DBOS)
EXECUTION_MODE=distributed  # or 'local'
```

### DBOS Admin UI
When `ENABLE_DBOS_EXECUTION=true` and `DBOS_ADMIN_ENABLED=true`:
- Access admin UI at `http://localhost:3022`
- View workflows, inspect steps, manage executions
- Query workflow status directly from PostgreSQL

## Monorepo Structure

### Workspace Dependencies

Packages reference each other using workspace protocol:
```json
{
  "dependencies": {
    "@badaitech/chaingraph-types": "workspace:*",
    "@badaitech/chaingraph-nodes": "workspace:*"
  }
}
```

### Build Order

Turbo handles build dependencies automatically via `dependsOn` in `turbo.json`:
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

### Package Exports

Packages use conditional exports for development vs production:
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "development": "./src/index.ts",    // Direct TS in dev
      "import": "./dist/index.js",        // Compiled in prod
      "default": "./dist/index.js"
    }
  }
}
```

## Troubleshooting

### DBOS Events Not Streaming
- Verify `ENABLE_DBOS_EXECUTION=true` in environment
- Check that ExecutionWorkflow writes `EXECUTION_CREATED` event
- Verify event bus is `DBOSEventBus` instance

### Child Executions Not Starting
- Check auto-start logic in `ExecutionWorkflow.ts:192-218`
- Look for "Auto-starting child execution" in logs
- Verify START_SIGNAL received

### Port Type Errors
- Ensure `reflect-metadata` is imported at app entry
- Check decorator order (type decorators come last)
- Verify Zod schemas match TypeScript types

### Build Failures
- Run `pnpm run typecheck` to identify type errors
- Check for circular dependencies between packages
- Ensure all workspace dependencies use `workspace:*`

## Documentation

- Node decorators: `docs/developer/nodes/node-decorators.md`
- Port decorators spec: `docs/developer/nodes/port-decorators-spec.md`
- DBOS architecture: `packages/chaingraph-executor/server/dbos/README.md`
- Architecture overview: `packages/chaingraph-executor/server/dbos/README.md#architecture`

## License

Business Source License 1.1 (BUSL-1.1) - see LICENSE.txt

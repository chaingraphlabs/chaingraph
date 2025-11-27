# DBOS Durable Execution for Chaingraph

**Status**: ✅ Production Ready
**Version**: 2.0.0
**Last Updated**: 2025-10-09

## 📖 Table of Contents

- [Overview](#overview)
- [Motivation](#motivation)
- [Architecture](#architecture)
- [Features](#features)
- [File Structure](#file-structure)
- [Configuration](#configuration)
- [Usage](#usage)
- [Child Executions](#child-executions)
- [Command System](#command-system)
- [Troubleshooting](#troubleshooting)
- [References](#references)

## 🎯 Overview

This directory contains the **DBOS Durable Execution** implementation for the Chaingraph execution layer. It provides a PostgreSQL-native, durable execution engine that replaces Kafka for task distribution and event streaming while offering automatic recovery, exactly-once semantics, and real-time workflow control.

### What is DBOS?

DBOS (Database-Oriented Operating System) is a durable execution framework that uses PostgreSQL as its foundation for:
- **Workflow orchestration** - Multi-step durable workflows with automatic checkpointing
- **Queue management** - PostgreSQL-backed durable queues with concurrency control
- **Event streaming** - Real-time workflow streams stored in PostgreSQL
- **Messaging** - Durable inter-workflow communication
- **Recovery** - Automatic workflow recovery on failures

### Quick Start

```bash
# Enable DBOS mode
export ENABLE_DBOS_EXECUTION=true

# Start services
pnpm run dev
```

## 💡 Motivation

### Problems with Kafka-Based Architecture

The original Kafka-based execution system had several challenges:

| Challenge | Impact | Lines of Code |
|-----------|--------|---------------|
| **Custom Recovery Logic** | Complex failure handling | ~350 lines |
| **Manual Claim Management** | Heartbeats, timeouts, expiration | ~200 lines |
| **Manual Offset Commits** | Race conditions, duplicates | ~150 lines |
| **At-Least-Once Semantics** | Possible duplicate executions | - |
| **Two Infrastructure Systems** | Kafka + PostgreSQL = operational overhead | - |
| **Event Streaming Race Conditions** | Clients subscribe before stream exists | - |

**Total complexity**: ~1,000+ lines of custom infrastructure code

### DBOS Benefits

| Benefit | Description | Code Saved |
|---------|-------------|------------|
| **Automatic Recovery** | Built-in workflow recovery | ~350 lines |
| **Exactly-Once Execution** | Idempotent workflows via workflow IDs | ~200 lines |
| **Durable Queues** | PostgreSQL-backed, no Kafka needed for tasks | ~150 lines |
| **Real-Time Streaming** | Built-in workflow streams | 0 (Kafka code reused) |
| **Workflow Messaging** | Inter-workflow communication for commands | New feature! |
| **Single Infrastructure** | PostgreSQL only (no Kafka for core execution) | Operational simplification |

**Total code reduction**: ~700 lines removed, ~500 lines added = **200 lines net reduction** with more features

### Design Philosophy

1. **PostgreSQL-Native** - Leverage PostgreSQL for all durable operations
2. **Automatic Everything** - Let DBOS handle recovery, retries, checkpointing
3. **Real-Time First** - Stream events and state changes immediately
4. **Developer Experience** - Simple API, clear error messages, easy debugging
5. **Production Ready** - Battle-tested DBOS runtime, proven scalability

## 🏗️ Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (tRPC)                                 │
│  1. create execution  → Creates ExecutionRow in PostgreSQL      │
│                        → Starts workflow immediately            │
│                        → Workflow writes EXECUTION_CREATED      │
│                        → Stream exists! ✅                        │
│  2. subscribe events  → Receives EXECUTION_CREATED immediately  │
│                        → Subscription active ✅                   │
│  3. start execution   → Sends START_SIGNAL via DBOS.send()     │
│                        → Workflow continues ▶️                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              EXECUTION WORKFLOW (DBOS Workflow)                  │
│                                                                  │
│  PHASE 1: Initialization (immediate)                            │
│    ├─ Create AbortController & CommandController               │
│    ├─ Start command polling (DBOS.recv every 500ms)             │
│    ├─ Load execution metadata from PostgreSQL                   │
│    ├─ DBOS.writeStream('events', EXECUTION_CREATED) ✅           │
│    ├─ Auto-start check (child? send signal to self)             │
│    └─ DBOS.recv('START_SIGNAL', timeout) ⏸️                      │
│                                                                  │
│  PHASE 2: Execution (after START_SIGNAL)                        │
│    ├─ Step 1: updateToRunning() ✓ checkpoint                   │
│    ├─ Step 2: executeFlowAtomic() ✓ checkpoint                 │
│    │   ├─ Load flow from PostgreSQL                             │
│    │   ├─ Create execution instance                             │
│    │   ├─ Execute flow (with command checking every 100ms)      │
│    │   ├─ Stream events via DBOS.writeStream() in real-time     │
│    │   ├─ Collect child tasks from emitted events               │
│    │   └─ Return { status, duration, childTasks }               │
│    ├─ Spawn children (DBOS.startWorkflow for each) ✓            │
│    └─ Step 3: updateToCompleted() ✓ checkpoint                 │
│                                                                  │
│  PHASE 3: Cleanup (automatic)                                   │
│    ├─ Stop command polling                                      │
│    └─ DBOS auto-closes event stream ✅                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 CHILD EXECUTIONS (Recursive)                     │
│  Each child follows the same workflow pattern:                  │
│    ├─ Writes own EXECUTION_CREATED event                        │
│    ├─ Auto-starts (no manual START_SIGNAL needed) 🚀             │
│    ├─ Executes flow                                             │
│    ├─ Can spawn its own children (up to depth 100)              │
│    └─ Completes independently                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Layers

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 1: tRPC API (server/trpc/router.ts)                   │
│  ├─ create()  → Start workflow, return executionId           │
│  ├─ start()   → Send START_SIGNAL                            │
│  ├─ stop()    → DBOS.cancelWorkflow() (immediate)            │
│  ├─ pause()   → DBOS.send('COMMAND', {command: 'PAUSE'})     │
│  └─ resume()  → DBOS.send('COMMAND', {command: 'RESUME'})    │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  Layer 2: Workflows (workflows/ExecutionWorkflow.ts)          │
│  ├─ Signal Pattern (START_SIGNAL wait)                       │
│  ├─ Command Polling (DBOS.recv every 500ms)                  │
│  ├─ Stream Initialization (EXECUTION_CREATED)                │
│  ├─ Step Orchestration (3 durable checkpoints)               │
│  └─ Child Spawning (DBOS.startWorkflow after step)           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  Layer 3: Steps (steps/*.ts)                                  │
│  ├─ UpdateStatusStep.ts                                      │
│  │   ├─ updateToRunning()                                    │
│  │   ├─ updateToCompleted()                                  │
│  │   └─ updateToFailed()                                     │
│  └─ ExecuteFlowAtomicStep.ts (THE CORE STEP)                 │
│      ├─ Load flow from PostgreSQL                            │
│      ├─ Create execution instance with controllers           │
│      ├─ Execute flow (up to 30 minutes)                      │
│      ├─ Stream events via DBOS.writeStream()                 │
│      ├─ Check commands every 100ms (shared state)            │
│      ├─ Collect child tasks from emitted events              │
│      └─ Return result with childTasks                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  Layer 4: Services (server/services/)                         │
│  ├─ ExecutionService.ts                                      │
│  │   ├─ createExecutionInstance()                            │
│  │   ├─ setupEventHandling() (DBOS streams)                  │
│  │   └─ getEventBus()                                        │
│  └─ ServiceFactory.ts                                        │
│      ├─ Initializes DBOS runtime                             │
│      ├─ Creates DBOSEventBus                                 │
│      ├─ Creates DBOSTaskQueue                                │
│      └─ Starts workers                                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  Layer 5: Infrastructure                                      │
│  ├─ PostgreSQL (DBOS system tables + execution data)         │
│  └─ DBOS Runtime (workflow engine, queues, streams)          │
└──────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 1. Real-Time Event Streaming

**File**: [`server/implementations/dbos/DBOSEventBus.ts`](../implementations/dbos/DBOSEventBus.ts)

Events are streamed in real-time via `DBOS.writeStream()` as the flow executes:

```typescript
// Published from step (allowed!)
await DBOS.writeStream('events', {
  executionId,
  event: serializedEvent,
  timestamp: Date.now(),
})

// Consumed from anywhere
for await (const streamValue of DBOS.readStream(executionId, 'events')) {
  const event = ExecutionEventImpl.deserializeStatic(streamValue.event)
  console.log(`[${event.index}] ${event.type}`, event.data)
}
```

**Key Points**:
- Events written from **step** = at-least-once semantics (may duplicate on retry)
- Events written from **workflow** = exactly-once semantics
- Stream auto-closes when workflow terminates
- No Kafka dependency for events (pure PostgreSQL)

**Documentation**: [DBOS_STREAMING_IMPLEMENTATION.md](../../DBOS_STREAMING_IMPLEMENTATION.md)

### 2. Signal Pattern (Race Condition Fix)

**File**: [`workflows/ExecutionWorkflow.ts`](./workflows/ExecutionWorkflow.ts)

Solves the race condition where clients subscribe to events before the stream exists:

```
Timeline:
1. create execution (tRPC)
   └─ Workflow starts → writes EXECUTION_CREATED (index -1) → stream exists! ✅
   └─ Workflow waits for START_SIGNAL... ⏸️

2. subscribe events (tRPC)
   └─ Stream already exists → immediately receives EXECUTION_CREATED ✅

3. start execution (tRPC)
   └─ Sends START_SIGNAL → workflow continues ▶️
```

**Benefits**:
- ✅ Stream guaranteed to exist before subscribe
- ✅ No missed events
- ✅ Rich metadata in EXECUTION_CREATED event (ownerId, rootExecutionId, depth, etc.)
- ✅ Timeout protection (5 minutes for parents, auto-start for children)

### 3. Hybrid Command System

**Files**:
- tRPC: [`server/trpc/router.ts`](../../trpc/router.ts)
- Workflow: [`workflows/ExecutionWorkflow.ts`](./workflows/ExecutionWorkflow.ts)
- Step: [`steps/ExecuteFlowAtomicStep.ts`](./steps/ExecuteFlowAtomicStep.ts)

Commands for controlling execution during runtime:

| Command | Mechanism | Where | Latency |
|---------|-----------|-------|---------|
| **STOP** | `DBOS.cancelWorkflow()` | Workflow cancellation | Immediate |
| **PAUSE** | `DBOS.send()` + polling | Workflow → shared state | ~600ms |
| **RESUME** | `DBOS.send()` + polling | Workflow → shared state | ~600ms |
| **STEP** | `DBOS.send()` + polling | Workflow → shared state | ~600ms |

**Architecture**:
```
Workflow Level (ExecutionWorkflow.ts):
  ├─ Create AbortController (for STOP)
  ├─ Create CommandController (for PAUSE/RESUME/STEP)
  ├─ Poll DBOS.recv('COMMAND') every 500ms
  │   └─ STOP → abortController.abort()
  │   └─ PAUSE/RESUME/STEP → commandController.currentCommand = cmd
  └─ Pass controllers to step ⬇️

Step Level (ExecuteFlowAtomicStep.ts):
  ├─ Check commandController every 100ms
  │   └─ PAUSE → debugger.pause()
  │   └─ RESUME → debugger.continue()
  │   └─ STEP → debugger.step()
  └─ Engine monitors abortController.signal
```

**Why Hybrid?**
- `DBOS.recv()` can **only** be called from workflows (not steps)
- Solution: Workflow polls messages, updates shared state
- Step reads shared state (no DBOS calls needed)

**Documentation**: [DBOS_COMMAND_SYSTEM.md](../../DBOS_COMMAND_SYSTEM.md)

### 4. Child Execution Support (Event Emitter Nodes)

**Files**:
- Step: [`steps/ExecuteFlowAtomicStep.ts`](./steps/ExecuteFlowAtomicStep.ts)
- Workflow: [`workflows/ExecutionWorkflow.ts`](./workflows/ExecutionWorkflow.ts)

Supports parent-child execution trees via Event Emitter nodes:

```
Parent Execution:
  ├─ EventEmitter node executes
  ├─ context.emitEvent('event-name', data)
  ├─ Event stored in context.emittedEvents[]
  ├─ Step completes, returns { childTasks: [...] }
  │
  └─ Workflow spawns children (allowed at workflow level!):
      For each childTask:
        └─ DBOS.startWorkflow(executionWorkflow, {
             workflowID: childTask.executionId
           })(childTask)

Child Execution:
  ├─ Workflow starts → writes EXECUTION_CREATED
  ├─ Detects parentExecutionId → auto-starts (sends signal to self) 🚀
  ├─ Executes flow independently
  ├─ Can spawn its own children (up to depth 100)
  └─ Completes independently
```

**Why Collect & Spawn?**
- `DBOS.startWorkflow()` can **only** be called from workflows (not steps)
- Solution: Collect child tasks in step, spawn from workflow
- Fast: ~15-30ms per child, non-blocking for parent

**Key Constraint**:
```
❌ DBOS.send()          - Not allowed in steps
❌ DBOS.recv()          - Not allowed in steps
❌ DBOS.startWorkflow() - Not allowed in steps
❌ DBOS.setEvent()      - Not allowed in steps
❌ DBOS.sleep()         - Not allowed in steps
✅ DBOS.writeStream()   - Allowed in steps!
```

### 5. Auto-Start for Children

**File**: [`workflows/ExecutionWorkflow.ts:192-218`](./workflows/ExecutionWorkflow.ts)

Child executions auto-start without manual `start` call:

```typescript
const isChildExecution = !!executionRow.parentExecutionId

if (isChildExecution) {
  // Send START_SIGNAL to self
  await DBOS.send(task.executionId, 'AUTO-START', 'START_SIGNAL')
}

// Wait for signal (10s for children, 5min for parents)
const startSignal = await DBOS.recv<string>('START_SIGNAL', isChildExecution ? 10 : 300)
```

**Benefits**:
- Children execute immediately after spawning
- No manual intervention needed
- Parent can spawn hundreds of children without blocking
- Each child has independent lifecycle

## 📁 File Structure

```
server/dbos/
├── README.md                          # This file
│
├── config.ts                          # DBOS initialization & lifecycle
│   ├─ initializeDBOS()                - Configure & launch DBOS
│   ├─ shutdownDBOS()                  - Graceful shutdown
│   └─ isDBOSLaunched()                - Check initialization status
│
├── types.ts                           # TypeScript type definitions
│   ├─ ExecutionResult                 - Workflow result (with childTasks)
│   ├─ DBOSQueueOptions                - Queue configuration
│   └─ CommandController               - Shared command state
│
├── DBOSExecutionWorker.ts             # Main worker class
│   ├─ start()                         - Initialize & start worker
│   ├─ stop()                          - Graceful shutdown
│   └─ getQueue()                      - Access execution queue
│
├── workflows/
│   ├── ExecutionWorkflow.ts           # Main execution workflow ⭐
│   │   ├─ Phase 1: Stream initialization & signal wait
│   │   ├─ Phase 2: 3-step execution (running → execute → completed)
│   │   ├─ Command polling (DBOS.recv every 500ms)
│   │   ├─ Child spawning (DBOS.startWorkflow after step)
│   │   └─ Auto-start logic for children
│   │
│   └── index.ts                       # Workflow exports
│
├── steps/
│   ├── ExecuteFlowAtomicStep.ts       # THE CORE STEP ⭐⭐⭐
│   │   ├─ executeFlowAtomic()         - Main execution function
│   │   ├─ createChildTask()           - Helper for child spawning
│   │   ├─ Command checking (100ms interval)
│   │   ├─ Event streaming (DBOS.writeStream)
│   │   └─ Child task collection
│   │
│   ├── UpdateStatusStep.ts            # Status update steps
│   │   ├─ updateToRunning()
│   │   ├─ updateToCompleted()
│   │   └─ updateToFailed()
│   │
│   └── index.ts                       # Step exports
│
├── queues/
│   ├── ExecutionQueue.ts              # DBOS queue wrapper
│   │   ├─ enqueue()                   - Add task to queue
│   │   ├─ getWorkflowHandle()         - Get workflow handle
│   │   ├─ getStatus()                 - Query workflow status
│   │   └─ getResult()                 - Wait for & get result
│   │
│   └── index.ts                       # Queue exports
│
└── index.ts                           # Main exports
```

### Integration Points

```
server/implementations/dbos/
├── DBOSEventBus.ts                    # IEventBus implementation
│   ├─ publishEvent()                  - Write to DBOS stream
│   └─ subscribeToEvents()             - Read from DBOS stream
│
└── DBOSTaskQueue.ts                   # ITaskQueue implementation
    ├─ publishTask()                   - Enqueue to DBOS queue
    └─ consumeTasks()                  - No-op (DBOS auto-consumes)
```

### Service Layer

```
server/services/
├── ServiceFactory.ts                  # Service initialization ⭐
│   ├─ Creates DBOSEventBus
│   ├─ Creates DBOSTaskQueue
│   ├─ Creates ExecutionService
│   ├─ Initializes steps
│   └─ Starts DBOS worker
│
└── ExecutionService.ts                # Execution logic
    ├─ createExecutionInstance()       - Setup flow engine
    ├─ setupEventHandling()            - Subscribe to engine events
    └─ getEventBus()                   - Access event bus
```

## ⚙️ Configuration

### Environment Variables

```bash
# ============================================================
# DBOS Configuration
# ============================================================

# Enable DBOS mode (default: false)
ENABLE_DBOS_EXECUTION=true

# DBOS Conductor (optional, for production monitoring)
# DBOS_CONDUCTOR_URL=https://conductor.dbos.dev
DBOS_APPLICATION_NAME=chaingraph-executor
# DBOS_CONDUCTOR_KEY=your-api-key-here

# DBOS Admin Server (local management UI)
DBOS_ADMIN_ENABLED=true
DBOS_ADMIN_PORT=3022                  # Default: 3022

# Concurrency Limits
DBOS_QUEUE_CONCURRENCY=100            # Global across all workers
DBOS_WORKER_CONCURRENCY=5              # Per worker process

# ============================================================
# Legacy Configuration (still needed for execution data)
# ============================================================

# Execution data storage
DATABASE_URL_EXECUTIONS=postgres://postgres@localhost:5432/chaingraph

# Execution mode
EXECUTION_MODE=distributed             # or 'local'
```

### Configuration File

**File**: [`server/utils/config.ts`](../../utils/config.ts)

```typescript
export const config = {
  dbos: {
    enabled: process.env.ENABLE_DBOS_EXECUTION === 'true',
    systemDatabaseUrl: process.env.DATABASE_URL_EXECUTIONS || ...,
    conductorURL: process.env.DBOS_CONDUCTOR_URL,
    applicationName: process.env.DBOS_APPLICATION_NAME || 'chaingraph-executor',
    conductorKey: process.env.DBOS_CONDUCTOR_KEY,
    adminServer: {
      enabled: process.env.DBOS_ADMIN_ENABLED !== 'false',
      port: Number.parseInt(process.env.DBOS_ADMIN_PORT) || 3022,
    },
    queueConcurrency: Number.parseInt(process.env.DBOS_QUEUE_CONCURRENCY) || 100,
    workerConcurrency: Number.parseInt(process.env.DBOS_WORKER_CONCURRENCY) || 5,
  },
}
```

## 🚀 Usage

### Initialize DBOS

**File**: [`config.ts`](./config.ts)

```typescript
import { initializeDBOS, shutdownDBOS } from '@badaitech/chaingraph-executor/server'

// Initialize DBOS runtime
await initializeDBOS()

// ... application runs ...

// Graceful shutdown
await shutdownDBOS()
```

### Start Worker

**File**: [`DBOSExecutionWorker.ts`](./DBOSExecutionWorker.ts)

```typescript
import { DBOSExecutionWorker } from '@badaitech/chaingraph-executor/server'

const worker = new DBOSExecutionWorker(
  executionStore,
  executionService,
  {
    concurrency: 100,
    workerConcurrency: 5,
  }
)

await worker.start()
// Worker now processes queued executions automatically
```

### Enqueue Execution

**File**: [`server/trpc/router.ts:128-239`](../../trpc/router.ts)

```typescript
// Create execution (starts workflow, stream initialized)
const { executionId } = await trpc.execution.create.mutate({
  flowId: 'V2ENKK6...',
  options: {},
  integration: { archai: { agentID, chatID } },
})

// Subscribe to events (stream exists, receives EXECUTION_CREATED)
const subscription = trpc.execution.subscribeToExecutionEvents.subscribe({
  executionId,
  fromIndex: 0,
})

// Start execution (sends START_SIGNAL)
await trpc.execution.start.mutate({ executionId })
```

### Control Execution

```typescript
// Pause (debugger stops at next node)
await trpc.execution.pause.mutate({
  executionId,
  reason: 'Debugging',
})

// Resume (debugger continues)
await trpc.execution.resume.mutate({ executionId })

// Stop (immediate cancellation)
await trpc.execution.stop.mutate({
  executionId,
  reason: 'User cancelled',
})
```

### Query Workflow Status

```typescript
import { DBOS } from '@dbos-inc/dbos-sdk'

// Get workflow status
const status = await DBOS.getStatus(executionId)
console.log(status.status) // PENDING, SUCCESS, ERROR, CANCELLED

// List workflows
const workflows = await DBOS.listWorkflows({
  workflowName: 'executeChainGraph',
  status: 'PENDING',
  limit: 50,
})

// Get workflow steps
const steps = await DBOS.listWorkflowSteps(executionId)
console.log(steps) // [updateToRunning, executeFlowAtomic, updateToCompleted]
```

## 👶 Child Executions

### Event Emitter Flow

**Node**: `@badaitech/chaingraph-nodes/src/nodes/flow/emitter.node.ts`

```typescript
// EventEmitter node executes
context.emitEvent('user-created', { userId: 123, name: 'Alice' })

// ↓ Event stored in context.emittedEvents[]

// ↓ After node completes, step collects event

// ↓ Step creates child ExecutionRow in DB

// ↓ Step returns { childTasks: [childTask] }

// ↓ Workflow spawns child via DBOS.startWorkflow()

// ↓ Child workflow starts:
//   - Writes own EXECUTION_CREATED event
//   - Auto-starts (sends START_SIGNAL to self)
//   - Executes flow
//   - Can spawn grandchildren (up to depth 100)
```

### Child Execution Lifecycle

```typescript
// Parent
const parentId = 'EXparent123'

// Parent emits event
// EventEmitter node → context.emitEvent('user-action', data)

// Child auto-spawned
const childId = 'EXchild456'
// ├─ parentExecutionId = 'EXparent123'
// ├─ rootExecutionId = 'EXparent123' (or parent's root)
// ├─ executionDepth = parent.depth + 1
// ├─ Auto-starts immediately
// └─ Executes independently

// Child can spawn grandchildren
// Grandchild:
// ├─ parentExecutionId = 'EXchild456'
// ├─ rootExecutionId = 'EXparent123'
// ├─ executionDepth = parent.depth + 2
// └─ And so on... (up to depth 100)
```

### Collect & Spawn Pattern

**Why this pattern?**
```
❌ Cannot call DBOS.startWorkflow() from step
❌ Cannot call DBOS.send() from step
✅ Can return data from step to workflow
✅ Can call DBOS.startWorkflow() from workflow
```

**Implementation**:
```typescript
// Step (ExecuteFlowAtomicStep.ts:231-258)
for (const event of context.emittedEvents.filter(e => !e.processed)) {
  const childTask = await createChildTask(instance, event, store)
  collectedChildTasks.push(childTask)
}
return { childTasks: collectedChildTasks }

// Workflow (ExecutionWorkflow.ts:236-258)
if (result.childTasks && result.childTasks.length > 0) {
  for (const childTask of result.childTasks) {
    await DBOS.startWorkflow(executionWorkflow, {
      workflowID: childTask.executionId
    })(childTask)
  }
}
```

## 🎮 Command System

### Command Flow

```
┌──────────────────────────────────────────────────────────┐
│  tRPC API Layer                                           │
│  ├─ stop   → DBOS.cancelWorkflow(executionId)            │
│  ├─ pause  → DBOS.send(executionId, {cmd: 'PAUSE'})      │
│  ├─ resume → DBOS.send(executionId, {cmd: 'RESUME'})     │
│  └─ step   → DBOS.send(executionId, {cmd: 'STEP'})       │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  Workflow Level (ExecutionWorkflow.ts)                   │
│  Command Polling Loop (500ms):                           │
│    const cmd = await DBOS.recv('COMMAND', 0)             │
│    if (cmd.command === 'STOP'):                          │
│      abortController.abort()                             │
│    else:                                                 │
│      commandController.currentCommand = cmd.command      │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  Step Level (ExecuteFlowAtomicStep.ts)                   │
│  Command Checking Loop (100ms):                          │
│    if (commandController.currentCommand):                │
│      switch (commandController.currentCommand):          │
│        PAUSE  → debugger.pause()                         │
│        RESUME → debugger.continue()                      │
│        STEP   → debugger.step()                          │
│    if (abortController.signal.aborted):                  │
│      → Engine stops gracefully                           │
└──────────────────────────────────────────────────────────┘
```

### Why Two-Level Polling?

**Workflow Level (500ms)**:
- Receives DBOS messages
- Updates shared state
- Handles STOP via abort()

**Step Level (100ms)**:
- Checks shared state (no DBOS calls!)
- Faster responsiveness
- No DBOS constraints violated

**Total Latency**: ~600ms from tRPC call to command execution

## 🔧 Troubleshooting

### Issue: Events Not Streaming

**Symptoms**: Execution completes but client receives no events

**Check**:
```typescript
// 1. Verify DBOS mode is enabled
console.log(config.dbos.enabled) // Should be true

// 2. Verify event bus is DBOSEventBus
const eventBus = getServices()?.eventBus
console.log(eventBus instanceof DBOSEventBus) // Should be true

// 3. Check DBOS stream
const events = []
for await (const value of DBOS.readStream(executionId, 'events')) {
  events.push(value)
}
console.log(events) // Should have EXECUTION_CREATED + flow events
```

**Solution**: Ensure `ENABLE_DBOS_EXECUTION=true` in environment

### Issue: Child Executions Not Starting

**Symptoms**: Child created in DB but never executes

**Check**:
```sql
-- Check child execution status
SELECT id, parent_execution_id, status, created_at
FROM executions
WHERE parent_execution_id = 'EXparent123';

-- Should see status = 'created' then 'running' then 'completed'
```

**Debug**:
```typescript
// Check if auto-start happened
// Look for log: "Auto-starting child execution: EXchild456"

// Check if START_SIGNAL received
// Look for log: "START_SIGNAL received, beginning execution"
```

**Solution**: Verify `ExecutionWorkflow.ts:192-218` has auto-start logic

### Issue: Commands Not Working

**Symptoms**: pause/resume/stop calls succeed but execution doesn't respond

**Check**:
```typescript
// 1. Verify command polling is running
// Look for log: "Received command: PAUSE for EX123..."

// 2. Check shared state updates
// CommandController should be updated by workflow polling

// 3. Verify step command checking
// Look for log: "Processing command: PAUSE for EX123..."
```

**Debug**:
```bash
# Enable debug logging
export LOG_LEVEL=debug

# Watch for command flow
tail -f logs/worker.log | grep -i "command"
```

**Solution**: Ensure both workflow polling (500ms) and step checking (100ms) are running

### Issue: Workflow Timeout

**Symptoms**: "Execution start timeout - START_SIGNAL not received"

**Cause**: Parent execution created but `start` never called

**Solution**:
```typescript
// Must call start after create
const { executionId } = await trpc.execution.create.mutate({ flowId })
await trpc.execution.start.mutate({ executionId }) // ← Required!
```

**Children**: Auto-start, no manual start needed

### Issue: DBOS Constraint Violations

**Symptoms**: "Invalid call to X inside a step or transaction"

**Common Violations**:
```typescript
// ❌ From step
await DBOS.send(...)          // Not allowed
await DBOS.recv(...)          // Not allowed
await DBOS.startWorkflow(...) // Not allowed
await DBOS.setEvent(...)      // Not allowed
await DBOS.sleep(...)         // Not allowed

// ✅ From step
await DBOS.writeStream(...)   // Allowed!
```

**Solution**: Move DBOS context methods to workflow level, use shared state in steps

## 📚 References

### Documentation

- **Streaming**: [DBOS_STREAMING_IMPLEMENTATION.md](../../DBOS_STREAMING_IMPLEMENTATION.md)
- **Commands**: [DBOS_COMMAND_SYSTEM.md](../../DBOS_COMMAND_SYSTEM.md)
- **Architecture**: [ARCHITECTURE.md](../../ARCHITECTURE.md)
- **Changelog**: [CHANGELOG.md](../../CHANGELOG.md)

### External Resources

- [DBOS Documentation](https://docs.dbos.dev/)
- [DBOS TypeScript Guide](https://docs.dbos.dev/typescript/programming-guide)
- [DBOS Workflow Tutorial](https://docs.dbos.dev/typescript/tutorials/workflow-tutorial)
- [DBOS Queue Tutorial](https://docs.dbos.dev/typescript/tutorials/queue-tutorial)
- [DBOS Streaming](https://docs.dbos.dev/typescript/tutorials/workflow-communication#workflow-streaming)
- [DBOS Messaging](https://docs.dbos.dev/typescript/tutorials/workflow-communication#workflow-messaging-and-notifications)
- [DBOS GitHub](https://github.com/dbos-inc/dbos-transact-ts)

### Key Files Reference

| File | Purpose | Lines | Critical? |
|------|---------|-------|-----------|
| [`workflows/ExecutionWorkflow.ts`](./workflows/ExecutionWorkflow.ts) | Main orchestration workflow | ~280 | ⭐⭐⭐ |
| [`steps/ExecuteFlowAtomicStep.ts`](./steps/ExecuteFlowAtomicStep.ts) | Core execution step | ~350 | ⭐⭐⭐ |
| [`config.ts`](./config.ts) | DBOS initialization | ~95 | ⭐⭐ |
| [`DBOSExecutionWorker.ts`](./DBOSExecutionWorker.ts) | Worker lifecycle | ~180 | ⭐⭐ |
| [`queues/ExecutionQueue.ts`](./queues/ExecutionQueue.ts) | Queue wrapper | ~120 | ⭐ |
| [`steps/UpdateStatusStep.ts`](./steps/UpdateStatusStep.ts) | Status updates | ~92 | ⭐ |
| [`../implementations/dbos/DBOSEventBus.ts`](../implementations/dbos/DBOSEventBus.ts) | Event streaming | ~250 | ⭐⭐ |
| [`../implementations/dbos/DBOSTaskQueue.ts`](../implementations/dbos/DBOSTaskQueue.ts) | Task queueing | ~120 | ⭐ |

## 🎯 Design Patterns

### 1. Signal Pattern
**Problem**: Stream doesn't exist when client subscribes
**Solution**: Workflow writes initialization event before waiting for start signal
**File**: `workflows/ExecutionWorkflow.ts:148-218`

### 2. Shared State Pattern
**Problem**: Cannot call DBOS.recv() from steps
**Solution**: Workflow polls, updates shared CommandController object
**File**: `workflows/ExecutionWorkflow.ts:107-146`

### 3. Collect & Spawn Pattern
**Problem**: Cannot call DBOS.startWorkflow() from steps
**Solution**: Step collects child tasks, workflow spawns them
**File**: `steps/ExecuteFlowAtomicStep.ts:231-258` + `workflows/ExecutionWorkflow.ts:236-258`

### 4. Auto-Start Pattern
**Problem**: Children need manual start call
**Solution**: Children send START_SIGNAL to themselves
**File**: `workflows/ExecutionWorkflow.ts:192-218`

## 🏆 Success Metrics

### Performance

- **Execution Latency**: ~50-150ms overhead vs Kafka (acceptable)
- **Event Streaming**: Real-time, <10ms per event
- **Child Spawning**: ~15-30ms per child, non-blocking
- **Command Latency**: ~600ms (workflow poll + step check)

### Reliability

- **Exactly-Once Execution**: ✅ Via workflow IDs
- **Automatic Recovery**: ✅ Via DBOS checkpoints
- **Event Durability**: ✅ Via DBOS streams (PostgreSQL)
- **Message Delivery**: ✅ Guaranteed via DBOS.send()

### Operational

- **Infrastructure**: PostgreSQL only (simpler)
- **Code Complexity**: -200 lines net (1,000 removed, 800 added)
- **Monitoring**: DBOS Admin UI + Conductor (optional)
- **Debugging**: Query workflows as database rows

## 🤝 Contributing

When modifying the DBOS implementation:

### Guidelines

1. **DBOS Constraints**: Know what's allowed where
   - Workflow: All DBOS methods ✅
   - Step: Only DBOS.writeStream() ✅

2. **Atomic Execution**: Keep executeFlowAtomic as ONE step
   - Don't split into multiple steps
   - Flow state must stay in-memory

3. **Real-Time Streaming**: Events must stream during execution
   - Don't batch events for later
   - Use DBOS.writeStream() from step

4. **Graceful Degradation**: Support Kafka mode fallback
   - Check `config.dbos.enabled` before DBOS-specific code
   - Keep interface-based design

5. **Type Safety**: Fully typed, no `any`
   - Use proper TypeScript interfaces
   - Type all DBOS callbacks

### Testing Checklist

Before committing changes:

- [ ] TypeScript compiles: `pnpm typecheck`
- [ ] Parent execution works end-to-end
- [ ] Child executions spawn and execute
- [ ] Event streaming works (check DBOS.readStream)
- [ ] Commands work (pause/resume/stop)
- [ ] Workflow recovery works (simulate crash)
- [ ] Concurrency limits respected
- [ ] Kafka fallback mode still works

### Common Pitfalls

❌ **Calling DBOS context methods from steps**
```typescript
// DON'T
async function myStep() {
  await DBOS.send(...) // ❌ Error!
}
```

❌ **Splitting atomic step**
```typescript
// DON'T
await DBOS.runStep(() => loadFlow())
await DBOS.runStep(() => executeFlow()) // ❌ State lost!
```

❌ **Forgetting auto-start for children**
```typescript
// DON'T
if (isChildExecution) {
  // Waiting... (times out after 10s)
}
```

✅ **Correct Patterns**
```typescript
// DO: Collect in step, spawn in workflow
const result = await DBOS.runStep(() => executeFlowAtomic())
for (const child of result.childTasks) {
  await DBOS.startWorkflow(...)(child)
}

// DO: Workflow polls, step checks shared state
// Workflow:
const cmd = await DBOS.recv('COMMAND', 0)
commandController.currentCommand = cmd.command

// Step:
if (commandController.currentCommand) {
  // Process command
}
```

## 📊 Monitoring & Observability

### DBOS Admin UI

**Access**: `http://localhost:3022` (when `DBOS_ADMIN_ENABLED=true`)

**Features**:
- View all workflows (status, duration, progress)
- Inspect workflow steps
- View workflow inputs/outputs
- Cancel/resume workflows
- View system metrics

### DBOS Conductor (Optional)

**Purpose**: Production monitoring and management

**Features**:
- Multi-instance workflow recovery
- Cross-region observability
- Workflow management dashboard
- Alerts and notifications

**Setup**:
```bash
DBOS_CONDUCTOR_URL=https://conductor.dbos.dev
DBOS_APPLICATION_NAME=chaingraph-executor-prod
DBOS_CONDUCTOR_KEY=your-api-key
```

### SQL Queries

```sql
-- Active executions
SELECT workflow_uuid, status, created_at, updated_at
FROM dbos.workflow_status
WHERE status IN ('PENDING', 'ENQUEUED')
ORDER BY created_at DESC;

-- Failed executions
SELECT workflow_uuid, status, error, created_at
FROM dbos.workflow_status
WHERE status = 'ERROR'
ORDER BY created_at DESC
LIMIT 20;

-- Execution steps
SELECT workflow_uuid, function_id, name, status, output
FROM dbos.workflow_inputs
WHERE workflow_uuid = 'EX123...';

-- Queue depth
SELECT COUNT(*) as pending_count
FROM dbos.workflow_status
WHERE status = 'ENQUEUED' AND queue_name = 'chaingraph-executions';
```

## 🎓 Learning Resources

### Understanding DBOS Constraints

The most important concept is **where DBOS context methods can be called**:

```typescript
┌─────────────────────────────────────────────────────┐
│  DBOS Context Methods (DBOS.* functions)            │
├─────────────────────────────────────────────────────┤
│  ✅ From WORKFLOW functions:                         │
│    - DBOS.send()                                    │
│    - DBOS.recv()                                    │
│    - DBOS.startWorkflow()                           │
│    - DBOS.setEvent() / getEvent()                   │
│    - DBOS.sleep()                                   │
│    - DBOS.cancelWorkflow()                          │
│    - DBOS.writeStream() / readStream()              │
│                                                     │
│  ✅ From STEP functions:                             │
│    - DBOS.writeStream()  (ONLY THIS ONE!)           │
│                                                     │
│  ❌ From STEP functions (NOT ALLOWED):               │
│    - DBOS.send()          → Use shared state        │
│    - DBOS.recv()          → Workflow level only     │
│    - DBOS.startWorkflow() → Return data, spawn from workflow │
│    - DBOS.setEvent()      → Workflow level only     │
│    - DBOS.sleep()         → Use setTimeout instead  │
└─────────────────────────────────────────────────────┘
```

### Example Workflow

```typescript
// workflows/ExampleWorkflow.ts
import { DBOS } from '@dbos-inc/dbos-sdk'

async function exampleWorkflow(task: MyTask): Promise<MyResult> {
  // ✅ Allowed: DBOS methods at workflow level
  await DBOS.send('other-workflow', 'hello', 'TOPIC')
  const msg = await DBOS.recv<string>('TOPIC', 60)
  await DBOS.writeStream('logs', 'workflow started')

  // ✅ Allowed: Run steps
  const result = await DBOS.runStep(() => myStep(task.data), {
    name: 'myStep'
  })

  // ✅ Allowed: Start child workflows
  await DBOS.startWorkflow(childWorkflow, {
    workflowID: result.childId
  })(result.childData)

  return result
}

export const exampleWorkflow = DBOS.registerWorkflow(exampleWorkflow)
```

### Example Step

```typescript
// steps/ExampleStep.ts
async function myStep(data: string): Promise<StepResult> {
  // ✅ Allowed: Regular async operations
  const result = await database.query(...)
  await fetch('https://api.example.com')

  // ✅ Allowed: Stream data
  await DBOS.writeStream('progress', { percent: 50 })

  // ❌ NOT Allowed: DBOS context methods
  // await DBOS.send(...)       // Error!
  // await DBOS.recv(...)       // Error!
  // await DBOS.startWorkflow(...) // Error!

  return { result, childData: [...] }
}
```

---

**Maintainers**: BadLabs Engineering Team
**Contact**: [GitHub Issues](https://github.com/badaitech/chaingraph/issues)
**License**: Business Source License 1.1

# Advanced DBOS Features

This document covers DBOS SDK features **not currently used** in ChainGraph but available for future use.

## Workflow Registration

DBOS supports two registration patterns:

```typescript
// Pattern 1: Inline workflow (used in ChainGraph)
@DBOS.workflow()
static async executeChainGraph(task: Task) { ... }

// Pattern 2: registerWorkflow (alternative)
async function myWorkflowFunction(task: Task) {
  await DBOS.runStep(() => step1())
  await DBOS.runStep(() => step2())
}
const myWorkflow = DBOS.registerWorkflow(myWorkflowFunction)
await myWorkflow(task)
```

---

## Debouncer Pattern

Delays workflow execution until some time has passed since the workflow was last called. Useful for preventing wasted work when workflows may be triggered multiple times in quick succession.

```typescript
import { Debouncer } from '@dbos-inc/dbos-sdk'

async function processInput(userInput: string) { ... }
const processInputWorkflow = DBOS.registerWorkflow(processInput)

const debouncer = new Debouncer({
  workflow: processInputWorkflow,
  debounceTimeoutMs: 60000,  // Max wait 60s total
})

// Each call delays execution by 5s, uses last input
await debouncer.debounce(
  userId,      // debounceKey - group by user
  5000,        // debouncePeriodMs - delay by 5s
  userInput    // workflow arg
)
```

---

## Workflow Versioning and Recovery

DBOS versions applications and their workflows. Only workflows matching the current application version are recovered automatically.

```typescript
// Set explicit version (optional)
DBOS.setConfig({
  name: 'chaingraph-executor',
  applicationVersion: 'v2.1.0',  // Or computed from code hash
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
})
```

**Recovery behavior:**
- Workflows are tagged with application version on start
- Only matching versions are auto-recovered on restart
- Use `DBOS.forkWorkflow()` to restart from specific step on new version

---

## Workflow Management Operations

### List Workflows

```typescript
const workflows = await DBOS.listWorkflows({
  workflowName: 'executeChainGraph',
  status: 'PENDING',
  startTime: '2024-01-01T00:00:00Z',
  limit: 100,
})
```

### Cancel Workflow

```typescript
await DBOS.cancelWorkflow(workflowID)
// Sets status to CANCELLED
// Removes from queue
// Preempts at next step boundary
```

### Resume Workflow

```typescript
const handle = await DBOS.resumeWorkflow<ResultType>(workflowID)
const result = await handle.getResult()
// Resumes from last completed step
// Use for CANCELLED or RETRIES_EXCEEDED workflows
```

### Fork Workflow

Restart a workflow from a specific step on a specific code version:

```typescript
const handle = await DBOS.forkWorkflow<ResultType>(
  workflowID,
  startStep,  // Step ID to resume from (functionID from listWorkflowSteps)
  {
    newWorkflowID: 'new-unique-id',
    applicationVersion: 'v2.1.0',  // Patch to new version
    timeoutMS: 300000,
  }
)
```

---

## Rate Limiting

Limit how many workflows can start in a given period:

```typescript
const queue = new WorkflowQueue('api-calls', {
  rateLimit: {
    limitPerPeriod: 50,   // Max 50 workflows
    periodSec: 30,        // Per 30 seconds
  },
})
```

Useful for rate-limited APIs (LLMs, payment processors).

---

## Partitioned Queues

Distribute work across dynamically created queue partitions:

```typescript
const queue = new WorkflowQueue('user-tasks', {
  partitionQueue: true,
  concurrency: 1,  // Per partition!
})

// Each user gets their own "subqueue"
await DBOS.startWorkflow(taskWorkflow, {
  queueName: queue.name,
  enqueueOptions: {
    queuePartitionKey: userId,  // Partition by user
  },
})(task)
```

With `concurrency: 1` per partition, each user's tasks run sequentially.

---

## Priority Queues

Process workflows by priority:

```typescript
const queue = new WorkflowQueue('priority-queue', {
  usePriority: true,
})

await DBOS.startWorkflow(taskWorkflow, {
  queueName: queue.name,
  enqueueOptions: {
    priority: 1,  // Lower = higher priority (1-2147483647)
  },
})(task)
```

Workflows without priority have highest priority (dequeue first).

---

## Workflow Timeouts

Set start-to-completion timeouts:

```typescript
const handle = await DBOS.startWorkflow(taskWorkflow, {
  timeoutMS: 300000,  // 5 minutes
})(task)

// When timeout expires:
// - Workflow status → CANCELLED
// - All children cancelled too
// - Preempted at next step boundary
```

Timeouts are **durable** - stored in database, persist across restarts.

---

## Scheduled Workflows

Run workflows on a cron schedule:

```typescript
async function scheduledFunction(schedTime: Date, startTime: Date) {
  DBOS.logger.info(`Running scheduled task at ${startTime}`)
}

const scheduledWorkflow = DBOS.registerWorkflow(scheduledFunction)
DBOS.registerScheduled(scheduledWorkflow, {
  crontab: '*/30 * * * * *',  // Every 30 seconds
})
```

---

## Durable Sleep

Sleep that survives restarts:

```typescript
@DBOS.workflow()
static async scheduleTask(task: Task, delayMs: number) {
  await DBOS.sleep(delayMs)  // Durable - wakes up on schedule even after restart
  await processTask(task)
}
```

Can schedule workflows days, weeks, or months in the future.

---

## DBOS Client (External Access)

Access DBOS from outside your application:

```typescript
import { DBOSClient } from '@dbos-inc/dbos-sdk'

const client = await DBOSClient.create({
  systemDatabaseUrl: process.env.DBOS_SYSTEM_DATABASE_URL,
})

// Enqueue workflow from external service
await client.enqueue<typeof processTask>({
  workflowName: 'processTask',
  queueName: 'task-queue',
}, taskData)

// Get workflow status
const status = await client.getWorkflowStatus(workflowID)

// Read event stream
for await (const event of client.readStream(workflowID, 'events')) {
  console.log(event)
}
```

---

## References

- [DBOS Documentation](https://docs.dbos.dev)
- [DBOS SDK GitHub](https://github.com/dbos-inc/dbos-transact-ts)

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// import { ExecutionStatus } from '@badaitech/chaingraph-types'

import { ExecutionStatus } from '@/store/execution'

export interface MockExecution {
  id: string
  flowId: string
  flowName: string
  status: ExecutionStatus
  parentExecutionId?: string
  executionDepth: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: {
    message: string
    nodeId?: string
  }
  triggeredByEvent?: {
    eventName: string
    payload?: any
  }
  childCount: number
}

// Generate mock execution data with parent-child relationships
export function generateMockExecutions(): MockExecution[] {
  const now = new Date()
  const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000)

  return [
    // Root execution 1 - Completed with children
    {
      id: 'EX_ROOT_001',
      flowId: 'flow_main_pipeline',
      flowName: 'Data Processing Pipeline',
      status: ExecutionStatus.COMPLETED,
      executionDepth: 0,
      createdAt: minutesAgo(30),
      startedAt: minutesAgo(30),
      completedAt: minutesAgo(5),
      childCount: 3,
    },
    {
      id: 'EX_CHILD_001',
      flowId: 'flow_validation',
      flowName: 'Input Validation',
      status: ExecutionStatus.COMPLETED,
      parentExecutionId: 'EX_ROOT_001',
      executionDepth: 1,
      createdAt: minutesAgo(28),
      startedAt: minutesAgo(28),
      completedAt: minutesAgo(25),
      triggeredByEvent: {
        eventName: 'data.received',
        payload: { recordCount: 1500 },
      },
      childCount: 0,
    },
    {
      id: 'EX_CHILD_002',
      flowId: 'flow_transform',
      flowName: 'Data Transformation',
      status: ExecutionStatus.COMPLETED,
      parentExecutionId: 'EX_ROOT_001',
      executionDepth: 1,
      createdAt: minutesAgo(25),
      startedAt: minutesAgo(25),
      completedAt: minutesAgo(15),
      triggeredByEvent: {
        eventName: 'validation.passed',
        payload: { validRecords: 1485 },
      },
      childCount: 2,
    },
    {
      id: 'EX_GRANDCHILD_001',
      flowId: 'flow_enrich',
      flowName: 'Data Enrichment',
      status: ExecutionStatus.COMPLETED,
      parentExecutionId: 'EX_CHILD_002',
      executionDepth: 2,
      createdAt: minutesAgo(23),
      startedAt: minutesAgo(23),
      completedAt: minutesAgo(18),
      triggeredByEvent: {
        eventName: 'transform.batch.ready',
        payload: { batchId: 'batch_001' },
      },
      childCount: 0,
    },
    {
      id: 'EX_GRANDCHILD_002',
      flowId: 'flow_aggregate',
      flowName: 'Data Aggregation',
      status: ExecutionStatus.COMPLETED,
      parentExecutionId: 'EX_CHILD_002',
      executionDepth: 2,
      createdAt: minutesAgo(20),
      startedAt: minutesAgo(20),
      completedAt: minutesAgo(16),
      triggeredByEvent: {
        eventName: 'transform.batch.ready',
        payload: { batchId: 'batch_002' },
      },
      childCount: 0,
    },
    {
      id: 'EX_CHILD_003',
      flowId: 'flow_export',
      flowName: 'Export Results',
      status: ExecutionStatus.COMPLETED,
      parentExecutionId: 'EX_ROOT_001',
      executionDepth: 1,
      createdAt: minutesAgo(15),
      startedAt: minutesAgo(15),
      completedAt: minutesAgo(10),
      triggeredByEvent: {
        eventName: 'processing.complete',
        payload: { totalProcessed: 1485 },
      },
      childCount: 0,
    },

    // Root execution 2 - Currently running with mixed statuses
    {
      id: 'EX_ROOT_002',
      flowId: 'flow_ai_agent',
      flowName: 'AI Agent Workflow',
      status: ExecutionStatus.RUNNING,
      executionDepth: 0,
      createdAt: minutesAgo(10),
      startedAt: minutesAgo(10),
      childCount: 4,
    },
    {
      id: 'EX_AI_CHILD_001',
      flowId: 'flow_prompt_prep',
      flowName: 'Prompt Preparation',
      status: ExecutionStatus.COMPLETED,
      parentExecutionId: 'EX_ROOT_002',
      executionDepth: 1,
      createdAt: minutesAgo(9),
      startedAt: minutesAgo(9),
      completedAt: minutesAgo(8),
      triggeredByEvent: {
        eventName: 'user.query.received',
        payload: { query: 'Analyze sales data' },
      },
      childCount: 0,
    },
    {
      id: 'EX_AI_CHILD_002',
      flowId: 'flow_llm_call',
      flowName: 'LLM Processing',
      status: ExecutionStatus.RUNNING,
      parentExecutionId: 'EX_ROOT_002',
      executionDepth: 1,
      createdAt: minutesAgo(8),
      startedAt: minutesAgo(8),
      triggeredByEvent: {
        eventName: 'prompt.ready',
        payload: { tokens: 245 },
      },
      childCount: 3,
    },
    {
      id: 'EX_LLM_TOOL_001',
      flowId: 'flow_tool_search',
      flowName: 'Database Search',
      status: ExecutionStatus.COMPLETED,
      parentExecutionId: 'EX_AI_CHILD_002',
      executionDepth: 2,
      createdAt: minutesAgo(7),
      startedAt: minutesAgo(7),
      completedAt: minutesAgo(6),
      triggeredByEvent: {
        eventName: 'tool.call.requested',
        payload: { tool: 'search_sales_db' },
      },
      childCount: 0,
    },
    {
      id: 'EX_LLM_TOOL_002',
      flowId: 'flow_tool_calc',
      flowName: 'Calculate Metrics',
      status: ExecutionStatus.RUNNING,
      parentExecutionId: 'EX_AI_CHILD_002',
      executionDepth: 2,
      createdAt: minutesAgo(5),
      startedAt: minutesAgo(5),
      triggeredByEvent: {
        eventName: 'tool.call.requested',
        payload: { tool: 'calculate_revenue' },
      },
      childCount: 0,
    },
    {
      id: 'EX_LLM_TOOL_003',
      flowId: 'flow_tool_viz',
      flowName: 'Generate Visualization',
      status: ExecutionStatus.CREATED,
      parentExecutionId: 'EX_AI_CHILD_002',
      executionDepth: 2,
      createdAt: minutesAgo(2),
      triggeredByEvent: {
        eventName: 'tool.call.requested',
        payload: { tool: 'create_chart' },
      },
      childCount: 0,
    },
    {
      id: 'EX_AI_CHILD_003',
      flowId: 'flow_response_format',
      flowName: 'Format Response',
      status: ExecutionStatus.CREATED,
      parentExecutionId: 'EX_ROOT_002',
      executionDepth: 1,
      createdAt: minutesAgo(1),
      triggeredByEvent: {
        eventName: 'llm.response.ready',
      },
      childCount: 0,
    },
    {
      id: 'EX_AI_CHILD_004',
      flowId: 'flow_notify',
      flowName: 'Send Notification',
      status: ExecutionStatus.CREATED,
      parentExecutionId: 'EX_ROOT_002',
      executionDepth: 1,
      createdAt: minutesAgo(1),
      triggeredByEvent: {
        eventName: 'response.formatted',
      },
      childCount: 0,
    },

    // Root execution 3 - Failed with error propagation
    {
      id: 'EX_ROOT_003',
      flowId: 'flow_webhook',
      flowName: 'Webhook Handler',
      status: ExecutionStatus.ERROR,
      executionDepth: 0,
      createdAt: minutesAgo(45),
      startedAt: minutesAgo(45),
      completedAt: minutesAgo(40),
      error: {
        message: 'Child execution failed',
        nodeId: 'node_webhook_process',
      },
      childCount: 2,
    },
    {
      id: 'EX_WEBHOOK_CHILD_001',
      flowId: 'flow_auth',
      flowName: 'Authenticate Request',
      status: ExecutionStatus.COMPLETED,
      parentExecutionId: 'EX_ROOT_003',
      executionDepth: 1,
      createdAt: minutesAgo(44),
      startedAt: minutesAgo(44),
      completedAt: minutesAgo(43),
      triggeredByEvent: {
        eventName: 'webhook.received',
        payload: { source: 'github' },
      },
      childCount: 0,
    },
    {
      id: 'EX_WEBHOOK_CHILD_002',
      flowId: 'flow_process',
      flowName: 'Process Webhook',
      status: ExecutionStatus.ERROR,
      parentExecutionId: 'EX_ROOT_003',
      executionDepth: 1,
      createdAt: minutesAgo(43),
      startedAt: minutesAgo(43),
      completedAt: minutesAgo(41),
      error: {
        message: 'Invalid payload structure',
        nodeId: 'node_parse_payload',
      },
      triggeredByEvent: {
        eventName: 'auth.success',
      },
      childCount: 0,
    },

    // Standalone execution (no children)
    {
      id: 'EX_STANDALONE_001',
      flowId: 'flow_cron',
      flowName: 'Scheduled Cleanup',
      status: ExecutionStatus.COMPLETED,
      executionDepth: 0,
      createdAt: minutesAgo(60),
      startedAt: minutesAgo(60),
      completedAt: minutesAgo(55),
      childCount: 0,
    },

    // Paused execution
    {
      id: 'EX_PAUSED_001',
      flowId: 'flow_manual',
      flowName: 'Manual Review Process',
      status: ExecutionStatus.PAUSED,
      executionDepth: 0,
      createdAt: minutesAgo(120),
      startedAt: minutesAgo(120),
      childCount: 1,
    },
    {
      id: 'EX_PAUSED_CHILD_001',
      flowId: 'flow_review',
      flowName: 'Await User Input',
      status: ExecutionStatus.PAUSED,
      parentExecutionId: 'EX_PAUSED_001',
      executionDepth: 1,
      createdAt: minutesAgo(115),
      startedAt: minutesAgo(115),
      triggeredByEvent: {
        eventName: 'review.required',
        payload: { reason: 'Manual approval needed' },
      },
      childCount: 0,
    },
  ]
}

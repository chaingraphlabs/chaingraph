/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
  NodeMetadata,
} from '@badaitech/chaingraph-types'
import {
  Boolean,
  Id,
  Input,
  Node,
  NodeExecutionStatus,
  NodeRegistry,
  Number,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { BaseNode } from '@badaitech/chaingraph-types/node'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { appRouter } from '../../../router'
import { createTestContext } from '../../../test/utils/createTestContext'
import { createCallerFactory } from '../../../trpc'

@Node({
  title: 'Scalar Node',
  description: 'Node with scalar ports',
}, null)
class ScalarNode extends BaseNode {
  @Input()
  @String({
    defaultValue: 'default string',
  })
  @Id('strInput')
  strInput: string = 'default string'

  @Input()
  @Number({
    defaultValue: 42,
  })
  @Id('numInput')
  numInput: number = 42

  @Input()
  @Boolean({
    defaultValue: true,
  })
  @Id('boolInput')
  boolInput: boolean = true

  @Id('strOutput')
  @String()
  @Output()
  strOutput: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('flow Node Procedures', () => {
  beforeAll(() => {
    NodeRegistry.getInstance().clear()
    NodeRegistry.getInstance().registerNode(ScalarNode)
  })

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  async function setupTestFlow() {
    const ctx = createTestContext(
      NodeRegistry.getInstance(),
    )

    const caller = createCallerFactory(appRouter)(ctx)
    const flow = await caller.flow.create({ name: 'Test Flow' })
    const types = await caller.nodeRegistry.listAvailableTypes()
    expect(types.length).toBeGreaterThan(0)

    // Find ScalarNode type
    const scalarNodeType = types.find((t: NodeMetadata) => t.title === 'Scalar Node')
    expect(scalarNodeType).toBeDefined()

    return { caller, flow, nodeType: scalarNodeType!.type }
  }

  describe('addNode', () => {
    it('should add node to existing flow', async () => {
      const { caller, flow, nodeType } = await setupTestFlow()

      // Add node to flow
      const node = await caller.flow.addNode({
        flowId: flow.id,
        nodeType,
        position: { x: 100, y: 100 },
      })

      // Verify node was added
      expect(node).toBeDefined()
      expect(node).toBeDefined()
      expect(node.metadata.title).toBe('Scalar Node')

      // Verify node exists in flow
      const fetchedFlow = await caller.flow.get(flow.id)
      expect(fetchedFlow.nodes).toHaveLength(1)
      expect(Array.from(fetchedFlow.nodes.values())[0].id).toBe(node.id)
    })
  })
})

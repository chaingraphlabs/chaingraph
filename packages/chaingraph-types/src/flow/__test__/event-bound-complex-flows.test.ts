/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeMetadata } from '../../node'
import type { NodeExecutionResult } from '../../node/types'
import { describe, expect, it } from 'vitest'
import { Node, NodeRegistry } from '../../decorator'
import { Edge } from '../../edge'
import { ExecutionContext } from '../../execution/execution-context'
import { BaseNode } from '../../node/base-node'
import { ExecutionEngine } from '../execution-engine'
import { ExecutionEventEnum } from '../execution-events'
import { Flow } from '../flow'

/**
 * Complex flow tests for event-bound node detection.
 *
 * These tests cover corner cases with:
 * - Deep downstream chains
 * - Diamond patterns
 * - Multiple EventListeners with shared downstream nodes
 * - Mixed event-bound and regular nodes
 * - Deep upstream dependencies of downstream nodes
 */
describe('event-Bound Complex Flows', () => {
  // Regular test node
  @Node({
    type: 'ComplexTestNode',
    title: 'Complex Test Node',
    description: 'A simple test node for complex flow tests',
  })
  class TestNode extends BaseNode {
    constructor(id: string, metadata?: NodeMetadata) {
      super(id, metadata || {
        type: 'ComplexTestNode',
        title: 'Complex Test Node',
      })
    }

    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
      return {}
    }
  }

  // EventListener test node
  @Node({
    type: 'ComplexEventListenerNodeV2',
    title: 'Complex Event Listener V2',
    description: 'Listens for events in complex flows',
  })
  class TestEventListenerNode extends BaseNode {
    eventName: string = 'test-event'

    constructor(id: string, eventName: string = 'test-event') {
      super(id, {
        type: 'EventListenerNodeV2',
        title: 'Test Event Listener V2',
        flowPorts: {
          disabledAutoExecution: true,
        },
      })
      this.eventName = eventName
    }

    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
      return {}
    }
  }

  // Setup: Register nodes before tests
  NodeRegistry.getInstance().registerNode(TestNode)
  NodeRegistry.getInstance().registerNode(TestEventListenerNode)

  // Helper to create execution context
  function createRootContext(flow: Flow) {
    const abortController = new AbortController()
    return new ExecutionContext(
      flow.id,
      abortController,
      undefined,
      'test-execution',
      {},
      undefined,
      undefined,
      undefined,
      false,
    )
  }

  function createEventContext(flow: Flow, eventName: string) {
    const abortController = new AbortController()
    return new ExecutionContext(
      flow.id,
      abortController,
      undefined,
      'test-execution',
      {},
      'root-execution',
      'parent-execution',
      { eventName, payload: {} },
      true,
    )
  }

  // Helper to execute and collect executed node IDs
  async function executeAndCollect(flow: Flow, context: ExecutionContext): Promise<string[]> {
    const engine = new ExecutionEngine(flow, context)
    const executedNodes: string[] = []

    engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
      executedNodes.push(event.data.node.id)
    })

    await engine.execute()
    return executedNodes
  }

  describe('deep Downstream Chains', () => {
    it('should mark deep downstream chain as event-bound', async () => {
      /**
       * Flow structure:
       * upstream -> eventListener -> down1 -> down2 -> down3 -> down4
       */
      const flow = new Flow({ name: 'deep-downstream' })

      const upstream = new TestNode('upstream')
      const listener = new TestEventListenerNode('listener', 'test-event')
      const down1 = new TestNode('down1')
      const down2 = new TestNode('down2')
      const down3 = new TestNode('down3')
      const down4 = new TestNode('down4')

      upstream.initialize()
      listener.initialize()
      down1.initialize()
      down2.initialize()
      down3.initialize()
      down4.initialize()

      await flow.addNode(upstream)
      await flow.addNode(listener)
      await flow.addNode(down1)
      await flow.addNode(down2)
      await flow.addNode(down3)
      await flow.addNode(down4)

      // Connect chain
      const edges = [
        { from: upstream, to: listener, id: 'e1' },
        { from: listener, to: down1, id: 'e2' },
        { from: down1, to: down2, id: 'e3' },
        { from: down2, to: down3, id: 'e4' },
        { from: down3, to: down4, id: 'e5' },
      ]

      for (const { from, to, id } of edges) {
        const outPort = from.getFlowOutPort()
        const inPort = to.getFlowInPort()
        if (outPort && inPort) {
          await flow.addEdge(new Edge(id, from, outPort, to, inPort))
        }
      }

      // Root context - all should be skipped
      const rootExecuted = await executeAndCollect(flow, createRootContext(flow))
      expect(rootExecuted).toHaveLength(0)

      // Event context - all should execute
      const eventExecuted = await executeAndCollect(flow, createEventContext(flow, 'test-event'))
      expect(eventExecuted).toContain('upstream')
      expect(eventExecuted).toContain('listener')
      expect(eventExecuted).toContain('down1')
      expect(eventExecuted).toContain('down2')
      expect(eventExecuted).toContain('down3')
      expect(eventExecuted).toContain('down4')
    })
  })

  describe('diamond Patterns', () => {
    it('should handle diamond pattern with nodeF feeding into downstream', async () => {
      /**
       * Flow structure (diamond):
       *
       *   upstream ──┐
       *              ├──> eventListener ──┐
       *   nodeA ─────┘                    ├──> downstream ──> final
       *                            nodeF ─┘
       */
      const flow = new Flow({ name: 'diamond-pattern' })

      const upstream = new TestNode('upstream')
      const nodeA = new TestNode('nodeA')
      const listener = new TestEventListenerNode('listener', 'test-event')
      const nodeF = new TestNode('nodeF')
      const downstream = new TestNode('downstream')
      const final = new TestNode('final')

      upstream.initialize()
      nodeA.initialize()
      listener.initialize()
      nodeF.initialize()
      downstream.initialize()
      final.initialize()

      await flow.addNode(upstream)
      await flow.addNode(nodeA)
      await flow.addNode(listener)
      await flow.addNode(nodeF)
      await flow.addNode(downstream)
      await flow.addNode(final)

      // Connect edges
      const upOut = upstream.getFlowOutPort()
      const nodeAOut = nodeA.getFlowOutPort()
      const listenerIn = listener.getFlowInPort()
      const listenerOut = listener.getFlowOutPort()
      const nodeFOut = nodeF.getFlowOutPort()
      const downstreamIn = downstream.getFlowInPort()
      const downstreamOut = downstream.getFlowOutPort()
      const finalIn = final.getFlowInPort()

      if (upOut && listenerIn)
        await flow.addEdge(new Edge('e1', upstream, upOut, listener, listenerIn))
      if (nodeAOut && listenerIn)
        await flow.addEdge(new Edge('e2', nodeA, nodeAOut, listener, listenerIn))
      if (listenerOut && downstreamIn)
        await flow.addEdge(new Edge('e3', listener, listenerOut, downstream, downstreamIn))
      if (nodeFOut && downstreamIn)
        await flow.addEdge(new Edge('e4', nodeF, nodeFOut, downstream, downstreamIn))
      if (downstreamOut && finalIn)
        await flow.addEdge(new Edge('e5', downstream, downstreamOut, final, finalIn))

      // Root context - all should be skipped (including nodeF)
      const rootExecuted = await executeAndCollect(flow, createRootContext(flow))
      expect(rootExecuted).toHaveLength(0)

      // Event context - all should execute
      const eventExecuted = await executeAndCollect(flow, createEventContext(flow, 'test-event'))
      expect(eventExecuted).toContain('upstream')
      expect(eventExecuted).toContain('nodeA')
      expect(eventExecuted).toContain('listener')
      expect(eventExecuted).toContain('nodeF')
      expect(eventExecuted).toContain('downstream')
      expect(eventExecuted).toContain('final')
    })

    it('should handle deep nodeF chain feeding into downstream', async () => {
      /**
       * Flow structure:
       *
       *   upstream ──> eventListener ──> downstream
       *                                      ↑
       *                     nodeF1 -> nodeF2 -> nodeF3
       */
      const flow = new Flow({ name: 'deep-nodeF-chain' })

      const upstream = new TestNode('upstream')
      const listener = new TestEventListenerNode('listener', 'test-event')
      const downstream = new TestNode('downstream')
      const nodeF1 = new TestNode('nodeF1')
      const nodeF2 = new TestNode('nodeF2')
      const nodeF3 = new TestNode('nodeF3')

      upstream.initialize()
      listener.initialize()
      downstream.initialize()
      nodeF1.initialize()
      nodeF2.initialize()
      nodeF3.initialize()

      await flow.addNode(upstream)
      await flow.addNode(listener)
      await flow.addNode(downstream)
      await flow.addNode(nodeF1)
      await flow.addNode(nodeF2)
      await flow.addNode(nodeF3)

      // Connect main chain
      const upOut = upstream.getFlowOutPort()
      const listenerIn = listener.getFlowInPort()
      const listenerOut = listener.getFlowOutPort()
      const downstreamIn = downstream.getFlowInPort()

      if (upOut && listenerIn)
        await flow.addEdge(new Edge('e1', upstream, upOut, listener, listenerIn))
      if (listenerOut && downstreamIn)
        await flow.addEdge(new Edge('e2', listener, listenerOut, downstream, downstreamIn))

      // Connect nodeF chain
      const f1Out = nodeF1.getFlowOutPort()
      const f2In = nodeF2.getFlowInPort()
      const f2Out = nodeF2.getFlowOutPort()
      const f3In = nodeF3.getFlowInPort()
      const f3Out = nodeF3.getFlowOutPort()

      if (f1Out && f2In)
        await flow.addEdge(new Edge('e3', nodeF1, f1Out, nodeF2, f2In))
      if (f2Out && f3In)
        await flow.addEdge(new Edge('e4', nodeF2, f2Out, nodeF3, f3In))
      if (f3Out && downstreamIn)
        await flow.addEdge(new Edge('e5', nodeF3, f3Out, downstream, downstreamIn))

      // Root context - all should be skipped
      const rootExecuted = await executeAndCollect(flow, createRootContext(flow))
      expect(rootExecuted).toHaveLength(0)

      // Event context - all should execute including entire nodeF chain
      const eventExecuted = await executeAndCollect(flow, createEventContext(flow, 'test-event'))
      expect(eventExecuted).toContain('upstream')
      expect(eventExecuted).toContain('listener')
      expect(eventExecuted).toContain('downstream')
      expect(eventExecuted).toContain('nodeF1')
      expect(eventExecuted).toContain('nodeF2')
      expect(eventExecuted).toContain('nodeF3')
    })
  })

  describe('multiple EventListeners', () => {
    it('should handle multiple EventListeners with shared downstream node', async () => {
      /**
       * Flow structure:
       *
       *   upA -> listenerA ──┐
       *                      ├──> sharedDownstream
       *   upB -> listenerB ──┘
       *
       * IMPORTANT: When sharedDownstream has TWO EventListener parents with different events,
       * it can only execute when BOTH parents complete. Since they listen for different events,
       * sharedDownstream cannot execute when only one event fires.
       */
      const flow = new Flow({ name: 'shared-downstream' })

      const upA = new TestNode('upA')
      const listenerA = new TestEventListenerNode('listenerA', 'event-a')
      const upB = new TestNode('upB')
      const listenerB = new TestEventListenerNode('listenerB', 'event-b')
      const sharedDownstream = new TestNode('sharedDownstream')

      upA.initialize()
      listenerA.initialize()
      upB.initialize()
      listenerB.initialize()
      sharedDownstream.initialize()

      await flow.addNode(upA)
      await flow.addNode(listenerA)
      await flow.addNode(upB)
      await flow.addNode(listenerB)
      await flow.addNode(sharedDownstream)

      // Connect
      const upAOut = upA.getFlowOutPort()
      const listenerAIn = listenerA.getFlowInPort()
      const listenerAOut = listenerA.getFlowOutPort()
      const upBOut = upB.getFlowOutPort()
      const listenerBIn = listenerB.getFlowInPort()
      const listenerBOut = listenerB.getFlowOutPort()
      const sharedIn = sharedDownstream.getFlowInPort()

      if (upAOut && listenerAIn)
        await flow.addEdge(new Edge('e1', upA, upAOut, listenerA, listenerAIn))
      if (listenerAOut && sharedIn)
        await flow.addEdge(new Edge('e2', listenerA, listenerAOut, sharedDownstream, sharedIn))
      if (upBOut && listenerBIn)
        await flow.addEdge(new Edge('e3', upB, upBOut, listenerB, listenerBIn))
      if (listenerBOut && sharedIn)
        await flow.addEdge(new Edge('e4', listenerB, listenerBOut, sharedDownstream, sharedIn))

      // Root context - none should execute
      const rootExecuted = await executeAndCollect(flow, createRootContext(flow))
      expect(rootExecuted).toHaveLength(0)

      // Event-a context - event-a chain executes
      // With OR semantics, sharedDownstream CAN execute because listenerA provides data
      // (at least one source per port is sufficient)
      const eventAExecuted = await executeAndCollect(flow, createEventContext(flow, 'event-a'))
      expect(eventAExecuted).toContain('upA')
      expect(eventAExecuted).toContain('listenerA')
      // sharedDownstream SHOULD execute - listenerA provides data (OR semantics)
      expect(eventAExecuted).toContain('sharedDownstream')
      expect(eventAExecuted).not.toContain('upB')
      expect(eventAExecuted).not.toContain('listenerB')

      // Event-b context - event-b chain executes
      // With OR semantics, sharedDownstream CAN execute because listenerB provides data
      const eventBExecuted = await executeAndCollect(flow, createEventContext(flow, 'event-b'))
      expect(eventBExecuted).toContain('upB')
      expect(eventBExecuted).toContain('listenerB')
      // sharedDownstream SHOULD execute - listenerB provides data (OR semantics)
      expect(eventBExecuted).toContain('sharedDownstream')
      expect(eventBExecuted).not.toContain('upA')
      expect(eventBExecuted).not.toContain('listenerA')
    })

    it('should handle nodeF shared by multiple downstream event chains', async () => {
      /**
       * Flow structure:
       *
       *   upA -> listenerA -> downA ──┐
       *                               ├── sharedNodeF feeds both
       *   upB -> listenerB -> downB ──┘
       */
      const flow = new Flow({ name: 'shared-nodeF' })

      const upA = new TestNode('upA')
      const listenerA = new TestEventListenerNode('listenerA', 'event-a')
      const downA = new TestNode('downA')
      const upB = new TestNode('upB')
      const listenerB = new TestEventListenerNode('listenerB', 'event-b')
      const downB = new TestNode('downB')
      const sharedNodeF = new TestNode('sharedNodeF')

      upA.initialize()
      listenerA.initialize()
      downA.initialize()
      upB.initialize()
      listenerB.initialize()
      downB.initialize()
      sharedNodeF.initialize()

      await flow.addNode(upA)
      await flow.addNode(listenerA)
      await flow.addNode(downA)
      await flow.addNode(upB)
      await flow.addNode(listenerB)
      await flow.addNode(downB)
      await flow.addNode(sharedNodeF)

      // Connect chain A
      const upAOut = upA.getFlowOutPort()
      const listenerAIn = listenerA.getFlowInPort()
      const listenerAOut = listenerA.getFlowOutPort()
      const downAIn = downA.getFlowInPort()

      if (upAOut && listenerAIn)
        await flow.addEdge(new Edge('e1', upA, upAOut, listenerA, listenerAIn))
      if (listenerAOut && downAIn)
        await flow.addEdge(new Edge('e2', listenerA, listenerAOut, downA, downAIn))

      // Connect chain B
      const upBOut = upB.getFlowOutPort()
      const listenerBIn = listenerB.getFlowInPort()
      const listenerBOut = listenerB.getFlowOutPort()
      const downBIn = downB.getFlowInPort()

      if (upBOut && listenerBIn)
        await flow.addEdge(new Edge('e3', upB, upBOut, listenerB, listenerBIn))
      if (listenerBOut && downBIn)
        await flow.addEdge(new Edge('e4', listenerB, listenerBOut, downB, downBIn))

      // Connect sharedNodeF to both downA and downB
      const sharedOut = sharedNodeF.getFlowOutPort()
      if (sharedOut && downAIn)
        await flow.addEdge(new Edge('e5', sharedNodeF, sharedOut, downA, downAIn))
      if (sharedOut && downBIn)
        await flow.addEdge(new Edge('e6', sharedNodeF, sharedOut, downB, downBIn))

      // Root context - none should execute
      const rootExecuted = await executeAndCollect(flow, createRootContext(flow))
      expect(rootExecuted).toHaveLength(0)

      // Event-a context - sharedNodeF should execute (it feeds downA)
      const eventAExecuted = await executeAndCollect(flow, createEventContext(flow, 'event-a'))
      expect(eventAExecuted).toContain('upA')
      expect(eventAExecuted).toContain('listenerA')
      expect(eventAExecuted).toContain('downA')
      expect(eventAExecuted).toContain('sharedNodeF')
      expect(eventAExecuted).not.toContain('upB')
      expect(eventAExecuted).not.toContain('listenerB')
      expect(eventAExecuted).not.toContain('downB')

      // Event-b context - sharedNodeF should also execute (it feeds downB)
      const eventBExecuted = await executeAndCollect(flow, createEventContext(flow, 'event-b'))
      expect(eventBExecuted).toContain('upB')
      expect(eventBExecuted).toContain('listenerB')
      expect(eventBExecuted).toContain('downB')
      expect(eventBExecuted).toContain('sharedNodeF')
      expect(eventBExecuted).not.toContain('upA')
      expect(eventBExecuted).not.toContain('listenerA')
      expect(eventBExecuted).not.toContain('downA')
    })
  })

  describe('mixed Event-Bound and Regular Flows', () => {
    it('should execute regular nodes while skipping event-bound nodes in root context', async () => {
      /**
       * Flow structure:
       *
       *   regularA -> regularB -> regularC    (regular chain)
       *
       *   eventUp -> listener -> eventDown    (event chain)
       *                             ↑
       *                          nodeF
       */
      const flow = new Flow({ name: 'mixed-flows' })

      // Regular chain
      const regularA = new TestNode('regularA')
      const regularB = new TestNode('regularB')
      const regularC = new TestNode('regularC')

      // Event chain
      const eventUp = new TestNode('eventUp')
      const listener = new TestEventListenerNode('listener', 'test-event')
      const eventDown = new TestNode('eventDown')
      const nodeF = new TestNode('nodeF')

      regularA.initialize()
      regularB.initialize()
      regularC.initialize()
      eventUp.initialize()
      listener.initialize()
      eventDown.initialize()
      nodeF.initialize()

      await flow.addNode(regularA)
      await flow.addNode(regularB)
      await flow.addNode(regularC)
      await flow.addNode(eventUp)
      await flow.addNode(listener)
      await flow.addNode(eventDown)
      await flow.addNode(nodeF)

      // Connect regular chain
      const regAOut = regularA.getFlowOutPort()
      const regBIn = regularB.getFlowInPort()
      const regBOut = regularB.getFlowOutPort()
      const regCIn = regularC.getFlowInPort()

      if (regAOut && regBIn)
        await flow.addEdge(new Edge('e1', regularA, regAOut, regularB, regBIn))
      if (regBOut && regCIn)
        await flow.addEdge(new Edge('e2', regularB, regBOut, regularC, regCIn))

      // Connect event chain
      const eventUpOut = eventUp.getFlowOutPort()
      const listenerIn = listener.getFlowInPort()
      const listenerOut = listener.getFlowOutPort()
      const eventDownIn = eventDown.getFlowInPort()
      const nodeFOut = nodeF.getFlowOutPort()

      if (eventUpOut && listenerIn)
        await flow.addEdge(new Edge('e3', eventUp, eventUpOut, listener, listenerIn))
      if (listenerOut && eventDownIn)
        await flow.addEdge(new Edge('e4', listener, listenerOut, eventDown, eventDownIn))
      if (nodeFOut && eventDownIn)
        await flow.addEdge(new Edge('e5', nodeF, nodeFOut, eventDown, eventDownIn))

      // Root context - only regular chain should execute
      const rootExecuted = await executeAndCollect(flow, createRootContext(flow))
      expect(rootExecuted).toContain('regularA')
      expect(rootExecuted).toContain('regularB')
      expect(rootExecuted).toContain('regularC')
      expect(rootExecuted).not.toContain('eventUp')
      expect(rootExecuted).not.toContain('listener')
      expect(rootExecuted).not.toContain('eventDown')
      expect(rootExecuted).not.toContain('nodeF')

      // Event context - only event chain should execute
      const eventExecuted = await executeAndCollect(flow, createEventContext(flow, 'test-event'))
      expect(eventExecuted).toContain('eventUp')
      expect(eventExecuted).toContain('listener')
      expect(eventExecuted).toContain('eventDown')
      expect(eventExecuted).toContain('nodeF')
      expect(eventExecuted).not.toContain('regularA')
      expect(eventExecuted).not.toContain('regularB')
      expect(eventExecuted).not.toContain('regularC')
    })
  })

  describe('complex Branching Patterns', () => {
    it('should handle branching downstream with multiple nodeF feeders', async () => {
      /**
       * Flow structure:
       *
       *                              ┌──> branchA ──> finalA
       *   upstream -> listener ──────┤
       *                              └──> branchB ──> finalB
       *                                      ↑
       *                         nodeFa -> nodeFb
       */
      const flow = new Flow({ name: 'branching-downstream' })

      const upstream = new TestNode('upstream')
      const listener = new TestEventListenerNode('listener', 'test-event')
      const branchA = new TestNode('branchA')
      const branchB = new TestNode('branchB')
      const finalA = new TestNode('finalA')
      const finalB = new TestNode('finalB')
      const nodeFa = new TestNode('nodeFa')
      const nodeFb = new TestNode('nodeFb')

      upstream.initialize()
      listener.initialize()
      branchA.initialize()
      branchB.initialize()
      finalA.initialize()
      finalB.initialize()
      nodeFa.initialize()
      nodeFb.initialize()

      await flow.addNode(upstream)
      await flow.addNode(listener)
      await flow.addNode(branchA)
      await flow.addNode(branchB)
      await flow.addNode(finalA)
      await flow.addNode(finalB)
      await flow.addNode(nodeFa)
      await flow.addNode(nodeFb)

      // Connect main chain
      const upOut = upstream.getFlowOutPort()
      const listenerIn = listener.getFlowInPort()
      const listenerOut = listener.getFlowOutPort()
      const branchAIn = branchA.getFlowInPort()
      const branchBIn = branchB.getFlowInPort()
      const branchAOut = branchA.getFlowOutPort()
      const branchBOut = branchB.getFlowOutPort()
      const finalAIn = finalA.getFlowInPort()
      const finalBIn = finalB.getFlowInPort()

      if (upOut && listenerIn)
        await flow.addEdge(new Edge('e1', upstream, upOut, listener, listenerIn))
      if (listenerOut && branchAIn)
        await flow.addEdge(new Edge('e2', listener, listenerOut, branchA, branchAIn))
      if (listenerOut && branchBIn)
        await flow.addEdge(new Edge('e3', listener, listenerOut, branchB, branchBIn))
      if (branchAOut && finalAIn)
        await flow.addEdge(new Edge('e4', branchA, branchAOut, finalA, finalAIn))
      if (branchBOut && finalBIn)
        await flow.addEdge(new Edge('e5', branchB, branchBOut, finalB, finalBIn))

      // Connect nodeF chain to branchB
      const nodeFaOut = nodeFa.getFlowOutPort()
      const nodeFbIn = nodeFb.getFlowInPort()
      const nodeFbOut = nodeFb.getFlowOutPort()

      if (nodeFaOut && nodeFbIn)
        await flow.addEdge(new Edge('e6', nodeFa, nodeFaOut, nodeFb, nodeFbIn))
      if (nodeFbOut && branchBIn)
        await flow.addEdge(new Edge('e7', nodeFb, nodeFbOut, branchB, branchBIn))

      // Root context - all should be skipped
      const rootExecuted = await executeAndCollect(flow, createRootContext(flow))
      expect(rootExecuted).toHaveLength(0)

      // Event context - all should execute
      const eventExecuted = await executeAndCollect(flow, createEventContext(flow, 'test-event'))
      expect(eventExecuted).toContain('upstream')
      expect(eventExecuted).toContain('listener')
      expect(eventExecuted).toContain('branchA')
      expect(eventExecuted).toContain('branchB')
      expect(eventExecuted).toContain('finalA')
      expect(eventExecuted).toContain('finalB')
      expect(eventExecuted).toContain('nodeFa')
      expect(eventExecuted).toContain('nodeFb')
    })
  })

  describe('edge Cases', () => {
    it('should handle EventListener with no downstream nodes', async () => {
      /**
       * Flow structure:
       *   upstream -> listener (no downstream)
       */
      const flow = new Flow({ name: 'no-downstream' })

      const upstream = new TestNode('upstream')
      const listener = new TestEventListenerNode('listener', 'test-event')

      upstream.initialize()
      listener.initialize()

      await flow.addNode(upstream)
      await flow.addNode(listener)

      const upOut = upstream.getFlowOutPort()
      const listenerIn = listener.getFlowInPort()

      if (upOut && listenerIn)
        await flow.addEdge(new Edge('e1', upstream, upOut, listener, listenerIn))

      // Root context - should skip
      const rootExecuted = await executeAndCollect(flow, createRootContext(flow))
      expect(rootExecuted).toHaveLength(0)

      // Event context - should execute
      const eventExecuted = await executeAndCollect(flow, createEventContext(flow, 'test-event'))
      expect(eventExecuted).toContain('upstream')
      expect(eventExecuted).toContain('listener')
    })

    it('should handle EventListener with no upstream nodes', async () => {
      /**
       * Flow structure:
       *   listener -> downstream
       */
      const flow = new Flow({ name: 'no-upstream' })

      const listener = new TestEventListenerNode('listener', 'test-event')
      const downstream = new TestNode('downstream')

      listener.initialize()
      downstream.initialize()

      await flow.addNode(listener)
      await flow.addNode(downstream)

      const listenerOut = listener.getFlowOutPort()
      const downstreamIn = downstream.getFlowInPort()

      if (listenerOut && downstreamIn)
        await flow.addEdge(new Edge('e1', listener, listenerOut, downstream, downstreamIn))

      // Root context - should skip
      const rootExecuted = await executeAndCollect(flow, createRootContext(flow))
      expect(rootExecuted).toHaveLength(0)

      // Event context - should execute
      const eventExecuted = await executeAndCollect(flow, createEventContext(flow, 'test-event'))
      expect(eventExecuted).toContain('listener')
      expect(eventExecuted).toContain('downstream')
    })

    it('should handle standalone EventListener (no connections)', async () => {
      /**
       * Flow structure:
       *   listener (isolated)
       *   regularNode (isolated)
       */
      const flow = new Flow({ name: 'isolated-listener' })

      const listener = new TestEventListenerNode('listener', 'test-event')
      const regularNode = new TestNode('regularNode')

      listener.initialize()
      regularNode.initialize()

      await flow.addNode(listener)
      await flow.addNode(regularNode)

      // Root context - only regular node should execute
      const rootExecuted = await executeAndCollect(flow, createRootContext(flow))
      expect(rootExecuted).toContain('regularNode')
      expect(rootExecuted).not.toContain('listener')

      // Event context - only listener should execute
      const eventExecuted = await executeAndCollect(flow, createEventContext(flow, 'test-event'))
      expect(eventExecuted).toContain('listener')
      expect(eventExecuted).not.toContain('regularNode')
    })

    it('should handle empty flow gracefully', async () => {
      const flow = new Flow({ name: 'empty-flow' })

      const rootExecuted = await executeAndCollect(flow, createRootContext(flow))
      expect(rootExecuted).toHaveLength(0)

      const eventExecuted = await executeAndCollect(flow, createEventContext(flow, 'test-event'))
      expect(eventExecuted).toHaveLength(0)
    })
  })
})

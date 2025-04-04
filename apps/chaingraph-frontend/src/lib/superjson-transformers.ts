/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort } from '@badaitech/chaingraph-types'
import {
  AnyPortPlugin,
  ArrayPortPlugin,
  BaseNode,
  BasePort,
  BooleanPortPlugin,
  Edge,
  EnumPortPlugin,
  ExecutionEventImpl,
  Flow,
  MultiChannel,
  NodeRegistry,
  NumberPortPlugin,
  ObjectPortPlugin,
  PortFactory,
  PortPluginRegistry,
  StreamPortPlugin,
  StringPortPlugin,
} from '@badaitech/chaingraph-types'
import SuperJSON from 'superjson'

export function initializeJsonTransformers() {
  PortPluginRegistry.getInstance().register(StringPortPlugin)
  PortPluginRegistry.getInstance().register(NumberPortPlugin)
  PortPluginRegistry.getInstance().register(AnyPortPlugin)
  PortPluginRegistry.getInstance().register(StreamPortPlugin)
  PortPluginRegistry.getInstance().register(ArrayPortPlugin)
  PortPluginRegistry.getInstance().register(ObjectPortPlugin)
  PortPluginRegistry.getInstance().register(EnumPortPlugin)
  PortPluginRegistry.getInstance().register(BooleanPortPlugin)

  // Execution event data
  SuperJSON.registerCustom<ExecutionEventImpl, any>(
    {
      isApplicable: (v): v is ExecutionEventImpl => {
        return v instanceof ExecutionEventImpl
      },
      serialize: (v) => {
        return {
          index: v.index,
          type: v.type,
          timestamp: v.timestamp,
          data: SuperJSON.stringify(v.data),
        }
      },
      deserialize: (v) => {
        try {
          const data = SuperJSON.parse(v.data)

          return new ExecutionEventImpl(
            v.index,
            v.type,
            v.timestamp,
            data,
          )
        } catch (e) {
          console.error('Failed to deserialize execution event', e)
          throw e
        }
      },
    },
    'ExecutionEventImpl',
  )

  SuperJSON.registerCustom<Flow, any>(
    {
      isApplicable: (v): v is Flow => {
        return v instanceof Flow
      },
      serialize: (v) => {
        return v.serialize()
      },
      deserialize: (v) => {
        try {
          // Deserialize flow from JSON string
          return Flow.deserialize(v) as Flow
        } catch (e) {
          console.error('Failed to deserialize flow', e)
          throw e
        }
      },
    },
    'Flow',
  )

  SuperJSON.registerCustom<IPort, any>(
    {
      isApplicable: (v): v is IPort => {
        return v instanceof BasePort
      },
      serialize: (v) => {
        return v.serialize()
      },
      deserialize: (v) => {
        try {
          const port = PortFactory.createFromConfig((v as any).config)
          return port.deserialize(v)
        } catch (e) {
          console.error('Error deserializing port:', e)
          throw e
        }
      },
    },
    'BasePort',
  )

  SuperJSON.registerCustom<Edge, any>(
    {
      isApplicable: (v): v is Edge => {
        return v instanceof Edge
      },
      serialize: (v) => {
        return SuperJSON.serialize({
          id: v.id,
          status: v.status,
          metadata: v.metadata,
          sourceNode: SuperJSON.serialize(v.sourceNode),
          sourcePort: SuperJSON.serialize(v.sourcePort),
          targetNode: SuperJSON.serialize(v.targetNode),
          targetPort: SuperJSON.serialize(v.targetPort),
        })
      },
      deserialize: (v) => {
        const edgeData = SuperJSON.deserialize(
          v as any,
        ) as any

        const sourceNode = SuperJSON.deserialize<INode>(edgeData.sourceNode)
        const sourcePort = SuperJSON.deserialize<IPort>(edgeData.sourcePort)
        const targetNode = SuperJSON.deserialize<INode>(edgeData.targetNode)
        const targetPort = SuperJSON.deserialize<IPort>(edgeData.targetPort)

        // todo: validate edgeData
        const edge = new Edge(
          edgeData.id,
          sourceNode,
          sourcePort,
          targetNode,
          targetPort,
          edgeData.metadata,
        )

        return edge
      },
    },
    'Edge',
  )

  SuperJSON.registerCustom<MultiChannel<any>, any>(
    {
    // isApplicable: (v): v is MultiChannel<any> => v instanceof MultiChannel,
      isApplicable: (v): v is MultiChannel<any> => {
        return v instanceof MultiChannel
      },
      serialize: (v) => {
        return v.serialize()
      },
      deserialize: (v) => {
        return MultiChannel.deserialize(v)
      },
    },
    'MultiChannel',
  )

  SuperJSON.registerCustom<INode, any>(
    {
      isApplicable: (v): v is INode => {
        return v instanceof BaseNode
      },
      serialize: (v) => {
        return v.serialize()
      },
      deserialize: (v) => {
        const nodeData = v as any
        const nodeMetadata = nodeData.metadata as any

        try {
          const node = NodeRegistry.getInstance().createNode(
            nodeMetadata.type,
            nodeData.id ?? nodeMetadata.id ?? '',
            nodeMetadata,
          )

          return node.deserialize(nodeData)
        } catch (e) {
          // eslint-disable-next-line no-debugger
          debugger
          console.error('Error deserializing node:', e)
          throw e
        }
      },
    },
    'BaseNode',
  )
}

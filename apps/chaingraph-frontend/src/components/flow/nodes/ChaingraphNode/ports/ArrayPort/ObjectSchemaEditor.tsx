/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  INode,
  IObjectSchema,
  IPort,
  IPortConfig,
  NodeExecutionResult,
  ObjectPortConfig,
} from '@badaitech/chaingraph-types'
import type {
  AddFieldObjectPortParams,
  PortContextValue,
  UpdatePortUIParams,
  UpdatePortValueParams,
} from '../context/PortContext'
import { BaseNode } from '@badaitech/chaingraph-types'
import { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ObjectPort } from '../ObjectPort/ObjectPort'

export interface ObjectSchemaEditorProps {
  initialSchema?: IObjectSchema
  onChange: (schema: IObjectSchema) => void
}

class EditorNode extends BaseNode {
  constructor(id: string) {
    super(id)
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

export function ObjectSchemaEditor({ initialSchema, onChange }: ObjectSchemaEditorProps) {
  // Generate unique IDs for node and port
  const nodeId = useMemo(() => `virtual-node-${uuidv4().substring(0, 8)}`, [])
  const portId = useMemo(() => `schema-port-${uuidv4().substring(0, 8)}`, [])

  // Create the schema state
  const [schema, setSchema] = useState<IObjectSchema>(() => initialSchema || {
    properties: {},
    type: 'object',
    description: 'Object Schema',
  })

  // Notify parent component when schema changes
  useEffect(() => {
    onChange(schema)
  }, [schema, onChange])

  const [virtualNode, setVirtualNode] = useState<INode>(new EditorNode(nodeId))

  // Create a basic virtual node that implements only what we need
  useEffect(() => {
    // Create the ports collection
    const portsMap = new Map<string, IPortConfig>()
    portsMap.set(portId, {
      id: portId,
      type: 'object',
      nodeId,
      title: 'Schema',
      schema,
      isSchemaMutable: true,
      ui: {
        hideEditor: false,
        keyDeletable: true,
        collapsed: true,
      },
    })

    const node = new EditorNode(nodeId)
    node.initialize(portsMap)

    setVirtualNode(node)
  }, [nodeId, portId, schema])

  // Create the port context with callbacks for the object port operations
  const portContext = useMemo<PortContextValue>(() => {
    return {
      // Update port value (schema updates)
      updatePortValue: (params: UpdatePortValueParams) => {
        const port = virtualNode.getPort(params.portId)
        if (!port) {
          return
        }

        try {
          port.setValue(params.value)
        } catch (e: any) {
          console.error('Error updating port value:', e)
          return
        }

        virtualNode.setPort(port)
        setVirtualNode(virtualNode.clone())
      },

      // Update UI properties for the port
      updatePortUI: (params: UpdatePortUIParams) => {
        const port = virtualNode.getPort(params.portId)
        if (!port) {
          return
        }

        port.setConfig({
          ...port.getConfig(),
          ui: {
            ...port.getConfig().ui,
            ...params.ui,
          },
        })
        virtualNode.setPort(port)

        setVirtualNode(virtualNode.clone())
      },

      // Add a field to the object schema
      addFieldObjectPort: (params: AddFieldObjectPortParams) => {
        const port = virtualNode.getPort(params.portId)
        if (!port) {
          return
        }

        virtualNode.addObjectProperty(port, params.key, params.config)
        setVirtualNode(virtualNode.clone())
      },

      // Remove a field from the object schema
      removeFieldObjectPort: (params) => {
        const port = virtualNode.getPort(params.portId)
        if (!port) {
          return
        }

        virtualNode.removeObjectProperty(port, params.key)
        setVirtualNode(virtualNode.clone())
      },

      appendElementArrayPort: (params) => {
        const port = virtualNode.getPort(params.portId)
        if (!port) {
          return
        }

        virtualNode.appendArrayItem(port, params.value)
        setVirtualNode(virtualNode.clone())
      },
      removeElementArrayPort: (params) => {
        const port = virtualNode.getPort(params.portId)
        if (!port) {
          return
        }

        virtualNode.removeArrayItem(port, params.index)
        setVirtualNode(virtualNode.clone())
      },

      // No edges in our virtual environment
      getEdgesForPort: () => [],
    }
  }, [virtualNode])

  const port = virtualNode.getPort(portId) as IPort<ObjectPortConfig>

  // If port is not yet available, return nothing
  if (!port) {
    return null
  }

  return (
    <div className="object-schema-editor border rounded-md p-3 bg-background/50">
      <div className="text-sm font-medium mb-2">Object Schema Editor</div>

      <ObjectPort
        node={virtualNode}
        port={port}
        context={portContext}
      />
    </div>
  )
}

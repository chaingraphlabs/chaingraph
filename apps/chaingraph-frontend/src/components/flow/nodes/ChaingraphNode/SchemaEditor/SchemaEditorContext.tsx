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
  IPortConfig,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import type { ReactNode } from 'react'
import type { SchemaEditorContextValue } from './types'
import { BaseNode } from '@badaitech/chaingraph-types'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

/**
 * Virtual node implementation for the schema editor
 * This node is used to manage ports and their configurations
 */
class EditorNode extends BaseNode {
  constructor(id: string) {
    super(id)
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

// Default context value with no-op functions
const defaultContext: SchemaEditorContextValue = {
  node: {} as INode,
  updateNode: () => { },
  getPortById: () => undefined,
  addPort: () => { },
  removePort: () => { },
  updatePort: () => { },
  getSchemaPortId: () => '',
}

// Create React context
const SchemaEditorContext = createContext<SchemaEditorContextValue>(defaultContext)

// Context provider props
interface SchemaEditorProviderProps {
  children: ReactNode
  initialConfig?: IPortConfig
}

/**
 * Provider component for the schema editor context
 * Creates and manages a virtual node for schema editing
 */
export function SchemaEditorProvider({ children, initialConfig }: SchemaEditorProviderProps) {
  // Generate node and main port IDs
  const [nodeId] = useState(() => `schema-editor-node-${uuidv4().substring(0, 8)}`)
  const [schemaPortId] = useState(() => `schema-main-port-${uuidv4().substring(0, 8)}`)

  // The virtual node instance
  const [virtualNode, setVirtualNode] = useState<INode>(() => new EditorNode(nodeId))

  // Initialize the node with the initial config
  useEffect(() => {
    if (!initialConfig)
      return

    const portsMap = new Map<string, IPortConfig>()
    portsMap.set(schemaPortId, {
      ...initialConfig,
      id: schemaPortId,
      nodeId,
    })

    const node = new EditorNode(nodeId)
    node.initialize(portsMap)

    setVirtualNode(node)
  }, [nodeId, schemaPortId, initialConfig])

  // Port manipulation functions
  const getPortById = useCallback(
    (portId: string) => {
      const port = virtualNode.getPort(portId)
      return port?.getConfig()
    },
    [virtualNode],
  )

  const addPort = useCallback(
    (portConfig: IPortConfig) => {
      const updatedNode = virtualNode.clone()

      // Ensure the port has an ID
      const portId = portConfig.id || `port-${uuidv4().substring(0, 8)}`
      const configWithId = {
        ...portConfig,
        id: portId,
        nodeId,
      }

      // Create port configs map
      const portsMap = new Map<string, IPortConfig>()
      portsMap.set(portId, configWithId)

      // Initialize the node with the port
      updatedNode.initializePortsFromConfigs(portsMap)

      setVirtualNode(updatedNode)
      return portId
    },
    [virtualNode, nodeId],
  )

  const removePort = useCallback(
    (portId: string) => {
      const updatedNode = virtualNode.clone()
      updatedNode.removePort(portId)
      setVirtualNode(updatedNode)
    },
    [virtualNode],
  )

  const updatePort = useCallback(
    (portConfig: IPortConfig) => {
      const portId = portConfig.id
      if (!portId)
        return

      const port = virtualNode.getPort(portId)
      if (!port)
        return

      // Update port configuration
      port.setConfig(portConfig)

      // Update the node
      const updatedNode = virtualNode.clone()
      updatedNode.setPort(port)

      setVirtualNode(updatedNode)
    },
    [virtualNode],
  )

  const getSchemaPortId = useCallback(() => schemaPortId, [schemaPortId])

  // Create the context value
  const contextValue = useMemo<SchemaEditorContextValue>(
    () => ({
      node: virtualNode,
      updateNode: setVirtualNode,
      getPortById,
      addPort,
      removePort,
      updatePort,
      getSchemaPortId,
    }),
    [virtualNode, getPortById, addPort, removePort, updatePort, getSchemaPortId],
  )

  return (
    <SchemaEditorContext.Provider value={contextValue}>
      {children}
    </SchemaEditorContext.Provider>
  )
}

/**
 * Hook to access the schema editor context
 */
export function useSchemaEditor() {
  const context = useContext(SchemaEditorContext)

  if (!context) {
    throw new Error('useSchemaEditor must be used within a SchemaEditorProvider')
  }

  return context
}

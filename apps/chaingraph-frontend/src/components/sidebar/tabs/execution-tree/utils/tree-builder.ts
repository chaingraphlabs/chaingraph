/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MockExecution } from './mock-data'

export interface ExecutionTreeNode extends MockExecution {
  children: ExecutionTreeNode[]
}

export function buildExecutionTree(executions: MockExecution[]): ExecutionTreeNode[] {
  const nodeMap = new Map<string, ExecutionTreeNode>()
  const rootNodes: ExecutionTreeNode[] = []

  // First pass: create all nodes
  executions.forEach((exec) => {
    nodeMap.set(exec.id, {
      ...exec,
      children: [],
    })
  })

  // Second pass: build tree structure
  executions.forEach((exec) => {
    const node = nodeMap.get(exec.id)!

    if (exec.parentExecutionId) {
      const parent = nodeMap.get(exec.parentExecutionId)
      if (parent) {
        parent.children.push(node)
      } else {
        // Orphaned node - add to root
        rootNodes.push(node)
      }
    } else {
      // Root node
      rootNodes.push(node)
    }
  })

  // Sort children by creation time (newest first)
  const sortChildren = (node: ExecutionTreeNode) => {
    node.children.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    node.children.forEach(sortChildren)
  }

  rootNodes.forEach(sortChildren)
  rootNodes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return rootNodes
}

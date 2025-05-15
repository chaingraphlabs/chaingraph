/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'

export function mergeNodePortsUi(node: INode, nodeToMerge: INode): INode {
  if (!node || !nodeToMerge) { // || nodeToMerge.getVersion() < node.getVersion()) {
    return node
  }

  const newNode = node.clone()

  const nodePorts = Array.from(newNode.ports.values())
  const nodeToMergePorts = Array.from(nodeToMerge.ports.values())

  for (const portId in nodeToMergePorts) {
    const portToMerge = nodeToMergePorts[portId]
    const port = nodePorts[portId]

    if (port && portToMerge) {
      if (port.getConfig().key !== portToMerge.getConfig().key) {
        console.warn(`Port keys do not match: ${port.getConfig().key} !== ${portToMerge.getConfig().key}`)
        continue
      }

      // check if the port is the object then recursive merge ui
      // if (port.getConfig().type === 'object' && portToMerge.getConfig().type === 'object') {
      //   const mergedPort = mergeNodePortsUi(port, portToMerge)
      //   newNode.setPort(mergedPort)
      //   continue
      // }

      // Merge the UI properties of the ports
      port.setConfig(
        {
          ...port.getConfig(),
          ui: {
            ...portToMerge.getConfig().ui,
          },
        },
      )

      newNode.setPort(port)
    }
  }

  newNode.setUI({
    ...node.getUI(),
    ...nodeToMerge.getUI(),
  })

  return newNode
}

// export function mergePorts(port: IPort, portToMerge: IPort): IPort {
//   const mergedPort = port.clone()
//
//   mergedPort.setConfig({
//     ...port.getConfig(),
//     ...portToMerge.getConfig(),
//   })
//
//   return mergedPort
// }

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IEdge } from '../edge'
import type { INode } from '../node'
import type { IPort } from '../port'
import type { IFlow } from './interface'
import { Edge } from '../edge'
import { NodeStatus } from '../node'
import { AnyPort } from '../port'

/**
 * Service responsible for transferring data through edges.
 * This service fetches fresh node and port instances from the flow
 * to avoid synchronization issues with stale references.
 */
export class EdgeTransferService {
  constructor(private readonly flow: IFlow) {}

  /**
   * Transfer data from source to target through an edge.
   * Fetches fresh instances from the flow to ensure synchronization.
   * Returns a new edge with updated references.
   *
   * @param edge The edge to transfer data through
   * @returns A new edge with updated node and port references
   * @throws Error if transfer cannot be completed
   */
  async transfer(edge: IEdge): Promise<IEdge> {
    // Fetch fresh node instances from the flow
    const sourceNode = this.flow.nodes.get(edge.sourceNode.id)
    const targetNode = this.flow.nodes.get(edge.targetNode.id)

    if (!sourceNode) {
      throw new Error(`Source node ${edge.sourceNode.id} not found in flow`)
    }
    if (!targetNode) {
      throw new Error(`Target node ${edge.targetNode.id} not found in flow`)
    }

    // Fetch fresh port instances from the nodes
    const sourcePort = sourceNode.getPort(edge.sourcePort.id)
    const targetPort = targetNode.getPort(edge.targetPort.id)

    if (!sourcePort) {
      throw new Error(`Source port ${edge.sourcePort.id} not found in node ${sourceNode.id}`)
    }
    if (!targetPort) {
      throw new Error(`Target port ${edge.targetPort.id} not found in node ${targetNode.id}`)
    }

    // Perform the actual transfer with fresh instances
    await this.performTransfer(sourceNode, sourcePort, targetNode, targetPort)

    // Create a new edge with the updated references
    // This ensures the edge has the correct port instances after transfer
    const updatedEdge = new Edge(
      edge.id,
      sourceNode,
      sourcePort,
      targetNode,
      targetPort,
      edge.metadata,
    )
    updatedEdge.status = edge.status

    return updatedEdge
  }

  /**
   * Perform the actual data transfer between ports.
   * This method contains the core transfer logic.
   */
  private async performTransfer(
    sourceNode: INode,
    sourcePort: IPort,
    targetNode: INode,
    targetPort: IPort,
  ): Promise<void> {
    const sourceNodeStatus = sourceNode.status
    const flowOutPort = sourceNode.getFlowOutPort()
    const errorPort = sourceNode.getErrorPort()
    const errorMessagePort = sourceNode.getErrorMessagePort()

    const isErrorTransferEdge = sourcePort.id === errorPort?.id || sourcePort.id === errorMessagePort?.id

    // Validate source node status
    if (
      sourceNodeStatus === NodeStatus.Error
      || sourceNodeStatus === NodeStatus.Skipped
      || sourceNodeStatus === NodeStatus.Disposed
    ) {
      if (!isErrorTransferEdge) {
        throw new Error(`Source node ${sourceNode.id} is in an invalid state: ${sourceNodeStatus}`)
      }
    }

    // Check for errors in source node
    if (errorPort && errorMessagePort && errorPort.getValue() === true) {
      if (!isErrorTransferEdge) {
        throw new Error(`Source node ${sourceNode.id} has an error: ${errorMessagePort.getValue()}`)
      }
    }

    // Check flow control
    if (flowOutPort && flowOutPort.getValue() !== true) {
      if (!isErrorTransferEdge) {
        throw new Error(`Source node ${sourceNode.id} is not allowed to execute`)
      }
    }

    // Get the value to transfer
    const data = sourcePort.getValue()
    // const data = value !== undefined ? value : sourcePort.getConfig().defaultValue

    const isEmptyData = data === undefined || data === null
    const isTargetPortRequired = targetPort.getConfig().required === true

    if (isEmptyData && isTargetPortRequired) {
      throw new Error(`Source port ${sourcePort.id} has no data to transfer and target port ${targetPort.id} is required`)
    }

    // Set the value on the target port
    targetPort.setValue(data)

    if (targetPort instanceof AnyPort) {
      targetNode.refreshAnyPortUnderlyingPorts(targetPort, true)
    }

    // Update the port in the target node
    targetNode.updatePort(targetPort, {
      sourceOfUpdate: 'EdgeTransferService:performTransfer',
    })
  }
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeMetadata, IEdge } from '.'
import type { INode } from '../node'
import type { IPort } from '../port'
import { EdgeStatus } from '.'
import { NodeStatus } from '../node'
import { PortDirection } from '../port'
import { getDefaultTransferEngine } from '../port/transfer-rules'
import { deepCopy } from '../utils'

export class Edge implements IEdge {
  readonly id: string
  readonly sourceNode: INode
  readonly sourcePort: IPort
  readonly targetNode: INode
  readonly targetPort: IPort
  readonly metadata: EdgeMetadata
  status: EdgeStatus = EdgeStatus.Inactive

  constructor(
    id: string,
    sourceNode: INode,
    sourcePort: IPort,
    targetNode: INode,
    targetPort: IPort,
    metadata: EdgeMetadata = {},
  ) {
    this.id = id
    this.sourceNode = sourceNode
    this.sourcePort = sourcePort
    this.targetNode = targetNode
    this.targetPort = targetPort
    this.metadata = metadata
  }

  async initialize(): Promise<void> {
    // Initialize the edge if necessary
    await this.validate()
    this.status = EdgeStatus.Active
  }

  async validate(): Promise<boolean> {
    // Check port directions
    if (this.sourcePort.getConfig().direction !== PortDirection.Output && this.sourcePort.getConfig().direction !== PortDirection.Passthrough) {
      throw new Error(`Source port ${this.sourcePort.id} is not an output or passthrough port.`)
    }

    if (this.targetPort.getConfig().direction !== PortDirection.Input && this.targetPort.getConfig().direction !== PortDirection.Passthrough) {
      throw new Error(`Target port ${this.targetPort.id} is not an input or passthrough port.`)
    }

    // Use the Transfer Rules engine for type validation
    const engine = getDefaultTransferEngine()

    if (!engine.canConnect(this.sourcePort, this.targetPort)) {
      const sourceConfig = this.sourcePort.getConfig()
      const targetConfig = this.targetPort.getConfig()
      throw new Error(`Incompatible port types: ${sourceConfig.type} -> ${targetConfig.type}`)
    }

    return true
  }

  async transfer(): Promise<void> {
    const sourceNodeStatus = this.sourceNode.status
    const flowOutPort = this.sourceNode.getFlowOutPort()
    const errorPort = this.sourceNode.getErrorPort()
    const errorMessagePort = this.sourceNode.getErrorMessagePort()

    console.debug(`[Edge] Transferring data from ${this.sourceNode.id}:${this.sourcePort.id} to ${this.targetNode.id}:${this.targetPort.id}. Value JSON: ${JSON.stringify(this.sourcePort.getValue())}`)

    const isErrorTransferEdge = this.sourcePort.id === errorPort?.id || this.sourcePort.id === errorMessagePort?.id

    if (
      sourceNodeStatus === NodeStatus.Error
      || sourceNodeStatus === NodeStatus.Skipped
      || sourceNodeStatus === NodeStatus.Disposed
    ) {
      if (!isErrorTransferEdge) {
        throw new Error(`Source node ${this.sourceNode.id} is in an invalid state.`)
      }
    }

    if (errorPort && errorMessagePort && errorPort.getValue() === true) {
      // check if the source port is error port or error message port
      if (!isErrorTransferEdge) {
        // and deny transfer if so
        throw new Error(`Source node ${this.sourceNode.id} has an error: ${errorMessagePort.getValue()}`)
      }
    }

    if (flowOutPort && flowOutPort.getValue() !== true) {
      // check if the source port is flow out port
      if (!isErrorTransferEdge) {
        // and deny transfer if so
        throw new Error(`Source node ${this.sourceNode.id} is not allowed to execute.`)
      }
    }

    // Transfer data from the source port to the target port
    const value = this.sourcePort.getValue()
    const data = value !== undefined ? value : this.sourcePort.getConfig().defaultValue
    if (data === undefined || data === null) {
      // console.error(`Source port ${this.sourcePort.id} has no data to transfer.`)
      // return
      throw new Error(`Source port ${this.sourcePort.id} has no data to transfer.`)
    }

    console.debug(`[Edge] Transferring value: ${JSON.stringify(data)} to target port ${this.targetPort.id}`)
    console.debug(`[Edge] Target port type: ${this.targetPort.getConfig().type}, Target port key: ${this.targetPort.getConfig().key}`)
    console.debug(`[Edge] Target port value BEFORE setValue: ${JSON.stringify(this.targetPort.getValue())}`)

    // Get the actual port from the target node's port manager
    const actualTargetPort = this.targetNode.getPort(this.targetPort.id)
    if (!actualTargetPort) {
      throw new Error(`Target port ${this.targetPort.id} not found in target node ${this.targetNode.id}`)
    }

    console.debug(`[Edge] Node's port instance value BEFORE: ${JSON.stringify(actualTargetPort.getValue())}`)
    console.debug(`[Edge] Edge's port instance === Node's port instance? ${this.targetPort === actualTargetPort}`)

    // Set the value on the actual port from the node
    actualTargetPort.setValue(data)
    console.debug(`[Edge] Node's port instance value AFTER setValue: ${JSON.stringify(actualTargetPort.getValue())}`)

    console.debug(`[Edge] Calling updatePort on target node ${this.targetNode.id}`)
    this.targetNode.updatePort(actualTargetPort, {
      sourceOfUpdate: `Edge:transfer:${this.sourceNode.id}:${this.sourcePort.id}`,
    })

    console.debug(`[Edge] Node's port instance value AFTER updatePort: ${JSON.stringify(actualTargetPort.getValue())}`)

    // Update the edge's reference to point to the actual port
    // this.targetPort = actualTargetPort
  }

  updateMetadata(metadata: Partial<EdgeMetadata>): void {
    Object.assign(this.metadata, metadata)
  }

  async dispose(): Promise<void> {
    // Clean up resources if necessary
    this.status = EdgeStatus.Inactive
  }

  clone(): IEdge {
    return new Edge(
      this.id,
      this.sourceNode.clone(),
      this.sourcePort.clone(),
      this.targetNode.clone(),
      this.targetPort.clone(),
      deepCopy(this.metadata),
    )
  }
}

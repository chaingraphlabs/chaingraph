/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeMetadata, IEdge } from '.'
import type { INode } from '../node'
import type { AnyPortConfig, IPort } from '../port'
import { EdgeStatus } from '.'
import { NodeStatus } from '../node'
import { PortDirection } from '../port'
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
    // Ensure ports are compatible
    const sourcePortKind = this.sourcePort.getConfig().type
    const targetPortKind = this.targetPort.getConfig().type

    if (this.sourcePort.getConfig().direction !== PortDirection.Output) {
      throw new Error(`Source port ${this.sourcePort.id} is not an output port.`)
    }

    if (this.targetPort.getConfig().direction !== PortDirection.Input) {
      throw new Error(`Target port ${this.targetPort.id} is not an input port.`)
    }

    // TODO: Add other validation checks here for example for AnyPort, StreamInputPort, StreamOutputPort, etc.
    if (sourcePortKind !== targetPortKind) {
      if (targetPortKind === 'any') {
        // allow to port with kind "any" to receive any connections
        return true
      }

      if (sourcePortKind === 'any') {
        // get the underlying type of source any port
        // and check if it is compatible with the target port
        const sourcePortConfig = this.sourcePort.getConfig() as AnyPortConfig
        const sourcePortUnderlyingType = sourcePortConfig.underlyingType
        if (sourcePortUnderlyingType) {
          if (sourcePortUnderlyingType.type === targetPortKind) {
            return true
          }
        }
      }

      throw new Error(`Incompatible port types: ${sourcePortKind} -> ${targetPortKind}`)
    }

    return true
  }

  async transfer(): Promise<void> {
    const sourceNodeStatus = this.sourceNode.status
    const flowOutPort = this.sourceNode.getFlowOutPort()
    const errorPort = this.sourceNode.getErrorPort()
    const errorMessagePort = this.sourceNode.getErrorMessagePort()

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
    if (data === undefined) {
      // console.error(`Source port ${this.sourcePort.id} has no data to transfer.`)
      // return
      throw new Error(`Source port ${this.sourcePort.id} has no data to transfer.`)
    }
    this.targetPort.setValue(data)
    this.targetNode.updatePort(this.targetPort)
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

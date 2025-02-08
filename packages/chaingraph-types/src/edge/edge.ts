/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '@badaitech/chaingraph-types/port/base'
import type { EdgeMetadata, IEdge } from '.'
import type { INode } from '../node'
import { PortDirection } from '@badaitech/chaingraph-types/port/base'
import { EdgeStatus } from '.'

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
      throw new Error(`Incompatible port types: ${sourcePortKind} -> ${targetPortKind}`)
    }

    return true
  }

  async transfer(): Promise<void> {
    // Transfer data from the source port to the target port
    const data = this.sourcePort.getValue() ?? this.sourcePort.getConfig().defaultValue
    if (data === undefined) {
      console.error(`Source port ${this.sourcePort.id} has no data to transfer.`)
      return
      // throw new Error(`Source port ${this.sourcePort.id} has no data to transfer.`)
    }
    this.targetPort.setValue(data)
  }

  updateMetadata(metadata: Partial<EdgeMetadata>): void {
    Object.assign(this.metadata, metadata)
  }

  async dispose(): Promise<void> {
    // Clean up resources if necessary
    this.status = EdgeStatus.Inactive
  }
}

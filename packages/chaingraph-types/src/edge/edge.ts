import type { IPort } from '@chaingraph/types/port-new/base'
import type { EdgeMetadata, IEdge } from '.'
import type { INode } from '../node'
import { PortDirection } from '@chaingraph/types/port-new/base'
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
      throw new Error(`Source port ${this.sourcePort.getConfig().id} is not an output port.`)
    }
    if (this.targetPort.getConfig().direction !== PortDirection.Input) {
      throw new Error(`Target port ${this.targetPort.getConfig().id} is not an input port.`)
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
      console.error(`Source port ${this.sourcePort.getConfig().id} has no data to transfer.`)
      return
      // throw new Error(`Source port ${this.sourcePort.getConfig().id} has no data to transfer.`)
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

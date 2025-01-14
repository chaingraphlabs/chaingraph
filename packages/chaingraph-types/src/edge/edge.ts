import type { EdgeMetadata, IEdge, INode, IPort } from '@chaingraph/types'
import { EdgeStatus, PortDirectionEnum } from '@chaingraph/types'

export class Edge implements IEdge {
  readonly id: string
  readonly sourceNode: INode
  readonly sourcePort: IPort<any>
  readonly targetNode: INode
  readonly targetPort: IPort<any>
  readonly metadata: EdgeMetadata
  status: EdgeStatus = EdgeStatus.Inactive

  constructor(
    id: string,
    sourceNode: INode,
    sourcePort: IPort<any>,
    targetNode: INode,
    targetPort: IPort<any>,
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
    const sourcePortKind = this.sourcePort.config.kind
    const targetPortKind = this.targetPort.config.kind

    if (this.sourcePort.config.direction !== PortDirectionEnum.Output) {
      throw new Error(`Source port ${this.sourcePort.config.id} is not an output port.`)
    }
    if (this.targetPort.config.direction !== PortDirectionEnum.Input) {
      throw new Error(`Target port ${this.targetPort.config.id} is not an input port.`)
    }

    // TODO: Add other validation checks here for example for AnyPort, StreamInputPort, StreamOutputPort, etc.
    if (sourcePortKind !== targetPortKind) {
      throw new Error(`Incompatible port types: ${sourcePortKind} -> ${targetPortKind}`)
    }

    return true
  }

  async transfer(): Promise<void> {
    // Transfer data from the source port to the target port
    const data = this.sourcePort.getValue()
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

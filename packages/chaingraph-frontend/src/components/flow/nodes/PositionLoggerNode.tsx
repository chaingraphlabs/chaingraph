import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'

export type PositionLoggerNode = Node<
  {
    label?: string
  },
  'position-logger'
>

export function PositionLoggerNodeComponent({
  positionAbsoluteX,
  positionAbsoluteY,
  data,
}: NodeProps<PositionLoggerNode>) {
  const x = `${Math.round(positionAbsoluteX)}px`
  const y = `${Math.round(positionAbsoluteY)}px`

  return (
    // We add this class to use the same styles as React Flow's default nodes.
    <div className="react-flow__node-default">
      {data.label && <div>{data.label}</div>}

      <div>
        {x}
        {' '}
        {y}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

import type { Node, NodeProps } from '@xyflow/react'

export type NumberNode = Node<{ number: number }, 'number'>

export default function NumberNodeComponent({ data }: NodeProps<NumberNode>) {
  return (
    <div>
      A special number:
      {data.number}
    </div>
  )
}

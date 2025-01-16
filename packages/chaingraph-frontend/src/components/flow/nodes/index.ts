import type { BuiltInNode } from '@xyflow/react'
import type { ChaingraphNode } from './ChaingraphCustomNode'
import type { NumberNode } from './NumberNode.tsx'
import type { PositionLoggerNode } from './PositionLoggerNode.tsx'

export type AppNode = BuiltInNode | PositionLoggerNode | NumberNode | ChaingraphNode

export const initialNodes: AppNode[] = [

  {
    id: '1',
    type: 'chaingraphNode',
    position: { x: 100, y: 100 },
    data: {
      title: 'Create Message',
      variant: 'blue',
      inputs: [
        { id: 'execute-in', label: 'Execute', type: 'execute' },
        { id: 'text-in', label: 'Text', type: 'data' },
      ],
      outputs: [
        { id: 'message-id-out', label: 'Message ID', type: 'data' },
        { id: 'execute-out', label: 'Execute', type: 'execute' },
      ],
    },
  },
  {
    id: '2',
    type: 'chaingraphNode',
    position: { x: 400, y: 100 },
    data: {
      title: 'Send Message',
      variant: 'green',
      inputs: [
        { id: 'execute-in', label: 'Execute', type: 'execute' },
        { id: 'message-id-in', label: 'Message ID', type: 'data' },
      ],
      outputs: [
        { id: 'execute-out', label: 'Execute', type: 'execute' },
      ],
    },
  },
]

// const nodeTypes = useMemo(() => ({
//   'position-logger': PositionLoggerNodeProps,
// }), [])

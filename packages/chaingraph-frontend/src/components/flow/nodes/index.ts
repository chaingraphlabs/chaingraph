import type { BuiltInNode } from '@xyflow/react'
import type { NumberNode } from './number-node.tsx'
import type { PositionLoggerNode } from './position-logger-node.tsx'

export type AppNode = BuiltInNode | PositionLoggerNode | NumberNode

export const initialNodes: AppNode[] = [
  { id: 'a', type: 'input', position: { x: 0, y: 0 }, data: { label: 'wire' } },
  {
    id: 'b',
    type: 'position-logger',
    position: { x: -100, y: 100 },
    data: { label: 'drag me!' },
  },
  { id: 'c', position: { x: 100, y: 100 }, data: { label: 'your ideas' } },
  {
    id: 'd',
    type: 'output',
    position: { x: 0, y: 200 },
    data: { label: 'with React Flow' },
  },
  {
    id: 'e',
    type: 'number',
    position: { x: 0, y: 200 },
    data: { number: 10000 },
  },
]

// const nodeTypes = useMemo(() => ({
//   'position-logger': PositionLoggerNodeProps,
// }), [])

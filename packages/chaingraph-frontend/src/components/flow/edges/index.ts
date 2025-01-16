import type { Edge, EdgeTypes } from '@xyflow/react'

export const initialEdges = [
  { id: 'a->c', source: 'a', target: 'c', animated: true },
  { id: 'b->d', source: 'b', target: 'd' },
  { id: 'c->d', source: 'c', target: 'd', animated: true },
] satisfies Edge[]

export const edgeTypes = {
  // Add your custom edge types here!
} satisfies EdgeTypes

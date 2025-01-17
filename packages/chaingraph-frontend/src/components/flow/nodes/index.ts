import type { ChaingraphNodeCustom } from '@/components/flow/nodes/ChaingraphCustomNode'
import type { ChaingraphNode } from '@/components/flow/nodes/ChaingraphNode'
import type { NodeCategoryValue } from '@chaingraph/nodes/categories/constants.ts'
import type { BuiltInNode } from '@xyflow/react'
import type { NumberNode } from './NumberNode.tsx'
import type { PositionLoggerNode } from './PositionLoggerNode.tsx'
import { nodeRegistry } from '@chaingraph/nodes'
import { CATEGORY_METADATA } from '@chaingraph/nodes/categories/constants.ts'

export type AppNode = BuiltInNode | PositionLoggerNode | NumberNode | ChaingraphNodeCustom | ChaingraphNode

const testCGNode = nodeRegistry.createNode('LLMPromptNode', 'LLMPromptNode:test')
testCGNode.initialize()

export const initialNodes: AppNode[] = [

  {
    id: '1',
    type: 'chaingraphNodeTest',
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
    type: 'chaingraphNodeTest',
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
  {
    id: '3',
    type: 'chaingraphNode',
    position: { x: 400, y: 400 },
    data: {
      node: testCGNode,
      categoryMetadata: CATEGORY_METADATA[testCGNode.metadata.category as NodeCategoryValue],
    },
  },
]

// const nodeTypes = useMemo(() => ({
//   'position-logger': PositionLoggerNodeProps,
// }), [])

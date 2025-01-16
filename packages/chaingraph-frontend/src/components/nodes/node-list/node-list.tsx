import type { INode } from '@chaingraph/types'
import { Box, Heading } from '@radix-ui/themes'
import { trpc } from '../../../api/trpc/client.ts'
import { Loading } from '../../common/Loading.tsx'
import { NodeListItem } from './node-list-item.tsx'

export function NodeList() {
  // Fetch available node types using tRPC
  const { data: nodes, isLoading, error } = trpc.nodeRegistry.listAvailableTypes.useQuery()

  if (isLoading)
    return <Loading />

  if (error) {
    return (
      <Box className="p-4 text-red-500">
        Error loading nodes:
        {' '}
        {error.message}
      </Box>
    )
  }

  return (
    <Box className="p-4">
      <Heading size="4" mb="4">Available Nodes</Heading>
      <div className="space-y-2">
        {nodes?.map((node: INode) => (
          <NodeListItem
            key={node.id}
            node={node}
          />
        ))}
      </div>
    </Box>
  )
}

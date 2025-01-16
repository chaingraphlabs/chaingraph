import type { INode } from '@chaingraph/types'
import { Box, Text } from '@radix-ui/themes'

interface NodeListItemProps {
  node: INode
}

export function NodeListItem({ node }: NodeListItemProps) {
  return (
    <Box className="p-3 border rounded-md hover:bg-gray-50">
      <Text weight="medium">{node.metadata?.title || node.metadata?.type}</Text>

      {node.metadata?.description && (
        <Text size="2" color="gray">
          {node.metadata?.description}
        </Text>
      )}
    </Box>
  )
}

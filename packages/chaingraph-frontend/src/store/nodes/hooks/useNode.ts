import { $nodesWithVersions } from '@/store/nodes'
import { useUnit } from 'effector-react'

function useNode(nodeId: string) {
  const { nodes, versions } = useUnit($nodesWithVersions)
  const node = nodes[nodeId]
  const version = versions[nodeId]

  return node
}

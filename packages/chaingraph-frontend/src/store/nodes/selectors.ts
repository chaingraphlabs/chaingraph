import { $nodesWithVersions } from '@/store/nodes/stores.ts'
import { useUnit } from 'effector-react'

function useNode(nodeId: string) {
  const { nodes, versions } = useUnit($nodesWithVersions)
  const node = nodes[nodeId]
  const version = versions[nodeId] // version используется здесь для триггера обновлений

  // Возвращаем только node, version нам не нужен в JSX
  return node
}

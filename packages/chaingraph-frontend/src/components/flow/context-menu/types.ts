import type { CategoryMetadata, INode } from '@chaingraph/types'
import type { MenuPosition } from './MenuPositionContext'

export interface NodeSelectEvent {
  node: INode
  categoryMetadata: CategoryMetadata
  position: MenuPosition
}

export interface FlowContextMenuProps {
  children: React.ReactNode
  onNodeSelect?: (event: NodeSelectEvent) => void
}

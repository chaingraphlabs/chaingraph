import type { EdgeData } from '@/store'
import type { IPortConfig } from '@badaitech/chaingraph-types'

export function isHideEditor(config: IPortConfig, connectedEdges: EdgeData[]) {
  if (config.direction === 'input' && connectedEdges.length > 0) {
    return false
  }

  const isOutput = config.direction === 'output'
  const hasConnections = connectedEdges.length > 0

  const isHideEditor
    = config.ui?.hideEditor === undefined && isOutput // for output port default is true
      ? true
      : !!config.ui?.hideEditor

  return !isHideEditor
}

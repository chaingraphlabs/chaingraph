/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeData } from '@/store'
import type { IPortConfig } from '@badaitech/chaingraph-types'

export function isHideEditor(config: IPortConfig, connectedEdges: EdgeData[]) {
  const hasConnections = connectedEdges.length > 0
  const isInput = config.direction === 'input'
  const isOutput = config.direction === 'output'

  if (isInput && hasConnections) {
    return true
  }

  const hideEditorUndefined = config.ui?.hideEditor === undefined
  if (isOutput && hideEditorUndefined) {
    return true
  }

  return false
}

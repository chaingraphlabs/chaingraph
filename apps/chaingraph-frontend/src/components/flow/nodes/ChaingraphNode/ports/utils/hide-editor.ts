/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '@badaitech/chaingraph-types'
import type { EdgeData } from '@/store/edges'

export function isHideEditor(config: IPortConfig, connectedEdges: EdgeData[]) {
  const hasInputConnections = connectedEdges
    .filter(edge => edge.targetPortId === config.id)
    .length > 0
  const isOutput = config.direction === 'output'
  const isEditorHiddenExplicit = config.ui?.hideEditor === true

  if (isEditorHiddenExplicit) {
    return true
  }

  if (hasInputConnections) {
    return true
  }

  const hideEditorUndefined = config.ui?.hideEditor === undefined
  if (isOutput && hideEditorUndefined) {
    return true
  }

  return !!config.ui?.hideEditor
}

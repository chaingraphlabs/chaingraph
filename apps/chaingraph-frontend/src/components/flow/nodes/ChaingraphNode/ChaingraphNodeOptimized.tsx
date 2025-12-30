/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeProps } from '@xyflow/react'
import type { ChaingraphNode } from './types'
import { memo } from 'react'
import ChaingraphNodeComponent from './ChaingraphNode'

// Enhanced memoization for node components
// This checks for changes more carefully than React.memo's default behavior
const ChaingraphNodeOptimized = memo(
  (props: NodeProps<ChaingraphNode>) => <ChaingraphNodeComponent {...props} />,
  (prevProps, nextProps) => {
    // Compare IDs
    if (prevProps.id !== nextProps.id)
      return false

    // Skip position comparison - React Flow handles this internally
    // and re-renders are expected when position changes

    // Compare selected state
    if (prevProps.selected !== nextProps.selected)
      return false

    // Compare node version
    const prevVersion = prevProps.data?.version ?? 0
    const nextVersion = nextProps.data?.version ?? 0
    if (prevVersion !== nextVersion)
      return false

    if (prevProps.width !== nextProps.width
      || prevProps.height !== nextProps.height) {
      return false
    }

    // All relevant props are the same - no need to re-render
    return true
  },
)

export default ChaingraphNodeOptimized

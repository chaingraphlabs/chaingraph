/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeTypes } from '@xyflow/react'
import { AnimatedEdge } from './AnimatedEdge'
import { FlowEdge } from './FlowEdge'

export const edgeTypes = {
  animated: AnimatedEdge,
  flow: FlowEdge,
  default: AnimatedEdge, // Fallback for edges without explicit type
} satisfies EdgeTypes

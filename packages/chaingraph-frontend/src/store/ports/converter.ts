/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Helpers for converting between live ports and their state representation
import type { PortState } from '@/store/ports/types.ts'
import type { IPort } from '@badaitech/chaingraph-types/port/base'

export function portToState(port: IPort): PortState {
  return {
    id: port.id!,
    nodeId: port.getConfig().nodeId!,
    config: port.getConfig(),
    value: port.getValue(),
  }
}

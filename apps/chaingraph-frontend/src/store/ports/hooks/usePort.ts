/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { $ports } from '@/store/ports/stores.ts'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'

export function usePort(nodeId: string, portId: string) {
  const ports = useUnit($ports)
  return useMemo(
    () => ports[`${nodeId}-${portId}`],
    [ports, nodeId, portId],
  )
}

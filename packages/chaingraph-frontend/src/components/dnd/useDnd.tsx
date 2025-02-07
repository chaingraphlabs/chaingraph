/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { DndContext } from '@/components/dnd/DndContext.tsx'
import { useContext } from 'react'

export function useDnd() {
  const context = useContext(DndContext)
  if (!context) {
    throw new Error('useDnd must be used within DndProvider')
  }
  return context
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortContextValue } from './PortContext'
import { useContext } from 'react'
import { PortContext } from './PortContext'

export function usePortContext(): PortContextValue {
  const context = useContext(PortContext)
  if (!context) {
    throw new Error('usePortContext must be used within a PortContextProvider')
  }
  return context
}

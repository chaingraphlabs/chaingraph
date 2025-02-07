/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MenuPosition } from './MenuPositionContext.tsx'
import { useMemo, useState } from 'react'
import { MenuPositionContext } from './MenuPositionContext.tsx'

export function MenuPositionProvider({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<MenuPosition | null>(null)

  const contextValue = useMemo(
    () => ({ position, setPosition }),
    [position],
  )

  return (
    <MenuPositionContext.Provider value={contextValue}>
      {children}
    </MenuPositionContext.Provider>
  )
}

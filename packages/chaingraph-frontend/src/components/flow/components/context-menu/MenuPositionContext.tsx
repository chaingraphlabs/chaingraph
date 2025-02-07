/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createContext } from 'react'

export interface MenuPosition {
  x: number
  y: number
  // Add viewport coordinates for proper positioning
  screenX: number
  screenY: number
}

interface MenuPositionContextType {
  position: MenuPosition | null
  setPosition: (position: MenuPosition | null) => void
}

export const MenuPositionContext = createContext<MenuPositionContextType | null>(null)

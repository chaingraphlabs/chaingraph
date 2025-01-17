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

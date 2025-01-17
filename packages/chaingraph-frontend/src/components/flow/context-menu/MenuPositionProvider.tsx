import type { MenuPosition } from './MenuPositionContext'
import { useMemo, useState } from 'react'
import { MenuPositionContext } from './MenuPositionContext'

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

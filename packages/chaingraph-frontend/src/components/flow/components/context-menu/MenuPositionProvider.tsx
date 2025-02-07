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

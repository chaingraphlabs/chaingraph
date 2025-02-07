import { useContext } from 'react'
import { MenuPositionContext } from './MenuPositionContext.tsx'

export function useMenuPosition() {
  const context = useContext(MenuPositionContext)
  if (!context) {
    throw new Error('useMenuPosition must be used within MenuPositionProvider')
  }
  return context
}

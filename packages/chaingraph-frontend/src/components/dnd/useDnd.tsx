import { DndContext } from '@/components/dnd/DndContext.tsx'
import { useContext } from 'react'

export function useDnd() {
  const context = useContext(DndContext)
  if (!context) {
    throw new Error('useDnd must be used within DndProvider')
  }
  return context
}

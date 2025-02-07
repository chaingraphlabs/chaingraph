import { useUnit } from 'effector-react'
import { $executionState } from '../stores'

export function useBreakpoint(nodeId: string): boolean {
  const { breakpoints } = useUnit($executionState)
  return breakpoints.has(nodeId)
}

import { useSelectedFlow } from '@chaingraph/frontend/components/sidebar/tabs/flow/hooks/useSelectedFlow'
import { type PropsWithChildren, useMemo } from 'react'
import { FlowContext } from './FlowContext'

export function FlowProvider({ children }: PropsWithChildren) {
  const { selectedFlow, setSelectedFlow, isLoading } = useSelectedFlow()

  const contextValue = useMemo(() => ({
    selectedFlow,
    setSelectedFlow,
    isLoading,
  }), [selectedFlow, setSelectedFlow, isLoading])

  return (
    <FlowContext.Provider value={contextValue}>
      {children}
    </FlowContext.Provider>
  )
}

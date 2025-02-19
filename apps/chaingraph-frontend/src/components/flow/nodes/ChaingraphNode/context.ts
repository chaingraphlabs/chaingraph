import type { IPort, IPortConfig } from '@badaitech/chaingraph-types'
import { createContext, useContext } from 'react'
import { CreatePortHandler, PortState } from './types'

interface NodeContextType {
  inputs: IPort<IPortConfig>[]
  outputs: IPort<IPortConfig>[]
  inputsStates: Record<string, PortState>
  outputsStates: Record<string, PortState>

  createChangeInputPortHandler: CreatePortHandler
  createChangeOutputPortHandler: CreatePortHandler
}

export const NodeContext = createContext<NodeContextType | undefined>(undefined)


export const useNodeContext = () => {
  const ctx = useContext(NodeContext);
  if(!ctx) throw new Error("useNodeContext must be used within NodeContext.Provider")

  return ctx
}

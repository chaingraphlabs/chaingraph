/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

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

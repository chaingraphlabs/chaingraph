/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { ExtractValue, IPortConfig } from '@badaitech/chaingraph-types'
import { Port } from './Port'
import { useNodeContext } from './context'


interface PortState< C extends IPortConfig = IPortConfig> {
  value: ExtractValue<C>
  isValid: boolean
}


export function NodeBody() {
  const {inputs, outputs, outputsStates, inputsStates, createChangeInputPortHandler, createChangeOutputPortHandler} = useNodeContext()


  const shallowInputsPorts = inputs.filter(input => !input.getConfig().parentId)
  const shallowOutputsPorts = outputs.filter(output => !output.getConfig().parentId)

  return (
    <div className="px-3 py-2 space-y-4">
      <div className="space-y-3">

        {/* Input Ports */}
        {shallowInputsPorts.map((port) => {
          const { value, isValid } = inputsStates[port.id]

          return (
            <Port
              key={port.id}
              port={port}
              value={value}
              errorMessage={isValid ? undefined : 'invalid'}
              onChange={createChangeInputPortHandler(port)}
            />
          )
        })}

        {/* Output Ports */}
        {shallowOutputsPorts.map((port) => {
          const { value, isValid } = outputsStates[port.id]

          return (
            <Port
              key={port.id}
              port={port}
              value={value}
              errorMessage={isValid ? undefined : 'invalid'}
              onChange={createChangeOutputPortHandler(port)}
            />
          )
        })}
      </div>
    </div>
  )
}

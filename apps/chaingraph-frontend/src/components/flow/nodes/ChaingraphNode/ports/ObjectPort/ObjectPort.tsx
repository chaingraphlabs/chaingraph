/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExtractValue, IPortConfig, ObjectPortConfig } from '@badaitech/chaingraph-types'
import type { ReactNode } from 'react'
import type { PortProps } from '../../Port'
import type { PortOnChangeParam } from '../../types'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'
import { AddFieldDialog } from './AddFieldDialog'

interface RenderPortParams<C extends IPortConfig> {
  portConfig: C
  value?: ExtractValue<C>
  onChange?: (param: PortOnChangeParam<C>) => void
  errorMessage?: string
}

export type ObjectPortProps = PortProps<ObjectPortConfig> & {
  renderPort: <C extends IPortConfig>(params: RenderPortParams<C>) => ReactNode
}

export function ObjectPort({ port, renderPort, value, onChange, errorMessage }: ObjectPortProps) {
  const config = port.getConfig()

  const title = config.title || config.key

  const properties = Object.values(config.schema.properties)

  return (
    <div className="relative flex gap-2 flex-col text-xs group/port bg-secondary rounded p-2 border border-foreground/50 mt-3">
      {config.direction === 'input' && <PortHandle port={port} />}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-x-2 font-semibold">
          <PortTitle className="font-semibold">{title}</PortTitle>
          <ChevronDown className="size-3" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="flex flex-col gap-y-2 mt-3 px-2">
            {properties.map((config) => {
              return <div key={config.id} className="inline-flex flex-col pb-2 border-b border-white/15 last:border-b-0">{renderPort({ portConfig: config })}</div>
            })}
          </div>
        </CollapsibleContent>

        <AddFieldDialog className="mt-3" title={`Add property for ${config.title || config.key}`} />

      </Collapsible>

      {config.direction === 'output' && <PortHandle port={port} />}
    </div>
  )
}

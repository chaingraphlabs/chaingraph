import type { ExtractValue, IPortConfig, ObjectPortConfig } from '@badaitech/chaingraph-types'
import { Fragment, type ReactNode } from 'react'
import type {  PortProps } from '../../Port'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'
import { PortOnChangeParam } from '../../types'
import {  AddFieldDialog } from './AddFieldDialog'

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
    <div className="relative flex gap-2 flex-col text-xs group/port bg-secondary rounded p-2 border border-foreground/50">
      {config.direction === 'input' && <PortHandle port={port} />}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-x-2 font-semibold">
        <PortTitle>{title}</PortTitle>
          <ChevronDown className="size-3" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className='flex flex-col gap-y-2'>
            {properties.map((config) => {
              return <Fragment key={config.id}>{renderPort({ portConfig: config })}</Fragment>
            })}
          </div>
        </CollapsibleContent>

        <AddFieldDialog title={`Add property for ${config.title || config.key}`} />

      </Collapsible>

      {config.direction === 'output' && <PortHandle port={port} />}
    </div>
  )
}

import type { ExtractValue, IPort, NumberPortConfig } from '@badaitech/chaingraph-types'
import { cn } from '@/lib/utils.ts'
import { useEdgesForPort } from '@/store/edges/hooks/useEdgesForPort.ts'
import { NumberInput } from '@badaitech/chaingraph-frontend/components/ui/number-input'
import { Slider } from '@badaitech/chaingraph-frontend/components/ui/slider'
import { useMemo } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

interface NumberOnChangeParam { value: ExtractValue<NumberPortConfig> | '' }

export interface NumberPortProps {
  port: IPort<NumberPortConfig>
  value?: ExtractValue<NumberPortConfig>
  onChange?: (param: NumberOnChangeParam) => void
  errorMessage?: string
}

export function NumberPort(props: NumberPortProps) {
  const { port, value, onChange, errorMessage } = props
  const config = port.getConfig()
  const ui = config.ui
  const title = config.title || config.key

  const connectedEdges = useEdgesForPort(port.id)
  const needRenderEditor = useMemo(() => {
    return !ui?.hideEditor && connectedEdges.length === 0
  }, [ui, connectedEdges])

  if (ui?.hidePort)
    return null

  return (
    <div
      key={config.id}
      className={cn(
        'relative flex items-center gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
      )}
    >
      {config.direction === 'output' && (
        <PortTitle>{title}</PortTitle>
      )}

      <PortHandle port={port} />

      {config.direction === 'input' && (
        <div className="flex flex-col">
          <PortTitle>{title}</PortTitle>

          {needRenderEditor && (
            <>
              <NumberInput
                disabled={ui?.disabled}
                className={errorMessage && 'border-red-500'}
                value={value}
                min={config.min}
                max={config.max}
                step={config.step}
                onValueChange={({ floatValue }, sourceInfo) => {
                  if (!sourceInfo.event?.isTrusted) {
                    return
                  }

                  const val = floatValue ?? Number.NaN
                  onChange?.({ value: Number.isNaN(val) ? '' : val })
                }}
              />
              <Slider
                className="mt-0.5"
                disabled={ui?.disabled}
                value={[value ?? 0]}
                min={config.min}
                max={config.max}
                step={config.step}
                onValueChange={(values) => {
                  // if (sourceInfo?.event.isTrusted === false) {
                  //   return
                  // }

                  onChange?.({ value: values[0] })
                }}
              />
            </>
          )}

        </div>
      )}
    </div>
  )
}

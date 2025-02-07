import type { ExtractValue, IPort, NumberPortConfig } from '@badaitech/chaingraph-types'
import { cn } from '@/lib/utils.ts'
import { NumberInput } from '@badaitech/chaingraph-frontend/components/ui/number-input'
import { Slider } from '@badaitech/chaingraph-frontend/components/ui/slider'
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
  const title = config.title || config.key

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

          <NumberInput
            className={errorMessage && 'border-red-500'}
            value={value}
            min={config.min}
            max={config.max}
            step={config.step}
            onValueChange={({ floatValue }) => {
              const val = floatValue ?? Number.NaN

              onChange?.({ value: Number.isNaN(val) ? '' : val })
            }}
          />
          <Slider
            className="mt-0.5"
            value={[value ?? 0]}
            min={config.min}
            max={config.max}
            step={config.step}
            onValueChange={(values) => {
              onChange?.({ value: values[0] })
            }}
          />
        </div>
      )}
    </div>
  )
}

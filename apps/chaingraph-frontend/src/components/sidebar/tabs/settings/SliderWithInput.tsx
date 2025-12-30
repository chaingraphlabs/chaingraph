/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { Slider } from '@/components/ui/slider'

interface SliderWithInputProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  hint?: string
  disabled?: boolean
}

export function SliderWithInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
  disabled,
}: SliderWithInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <NumberInput
          className="w-20 h-7 text-xs px-2"
          value={value}
          decimalScale={step < 1 ? 2 : 0}
          onValueChange={(values) => {
            const newValue = values.floatValue ?? min
            // Clamp to min/max
            onChange(Math.min(max, Math.max(min, newValue)))
          }}
          disabled={disabled}
        />
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
      />
      {hint && (
        <p className="text-[10px] text-muted-foreground leading-tight">{hint}</p>
      )}
    </div>
  )
}

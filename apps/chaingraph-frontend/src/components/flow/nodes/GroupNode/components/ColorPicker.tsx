/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import Color from 'color'
import { Paintbrush } from 'lucide-react'
import { useCallback, useState } from 'react'
import { CirclePicker } from 'react-color'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ className, color, onChange }: ColorPickerProps) {
  const [localColor, setLocalColor] = useState(() => {
    const c = Color(color)
    return {
      hex: c.hex(),
      alpha: c.alpha(),
    }
  })

  const handleColorChange = useCallback((hex: string) => {
    setLocalColor(prev => ({ ...prev, hex }))

    const newColor = Color(localColor.hex).alpha(localColor.alpha).rgb().string()
    onChange(newColor)
  }, [localColor, onChange])

  const handleAlphaChange = useCallback((values: number[]) => {
    setLocalColor(prev => ({ ...prev, alpha: values[0] }))

    const newColor = Color(localColor.hex).alpha(localColor.alpha).rgb().string()
    onChange(newColor)
  }, [localColor, onChange])

  // useEffect(() => {
  // }, [localColor, onChange])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 hover:bg-muted/50 hover:text-muted-foreground',
            className,
          )}
        >
          <Paintbrush className="h-6 w-6 text-muted-foreground/60 hover:text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="flex flex-col gap-4">
          <CirclePicker
            color={localColor.hex}
            onChange={(color) => {
              handleColorChange(color.hex)
              handleAlphaChange([localColor.alpha])
            }}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Opacity:</span>
              {' '}
              {' '}
              <span className="text-sm text-muted-foreground">
                {Math.round(localColor.alpha * 100)}
                %
              </span>
            </div>
            <Slider
              defaultValue={[localColor.alpha]}
              max={1}
              step={0.01}
              value={[localColor.alpha]}
              onValueChange={handleAlphaChange}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <div
              className="w-8 h-8 rounded-md border"
              style={{
                backgroundColor: Color(localColor.hex)
                  .alpha(localColor.alpha)
                  .rgb()
                  .string(),
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

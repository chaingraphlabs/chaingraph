/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CurveType, RenderMode } from '@/store/settings/curve-config'
import { useUnit } from 'effector-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  $curveConfig,

  resetCurveConfig,
  setCurveConfig,
} from '@/store/settings/curve-config'
import { SliderWithInput } from './SliderWithInput'

export function EdgeCurveSettings() {
  const config = useUnit($curveConfig)
  const setConfig = useUnit(setCurveConfig)
  const resetConfig = useUnit(resetCurveConfig)

  const handleCurveTypeChange = (value: string) => {
    setConfig({ curveType: value as CurveType })
  }

  const handleRenderModeChange = (value: string) => {
    setConfig({ renderMode: value as RenderMode })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Edge Curves</h3>

      {/* Render Mode Selector */}
      <div className="space-y-2">
        <Label className="text-xs">Render Mode</Label>
        <Select value={config.renderMode} onValueChange={handleRenderModeChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bezier-chain">Smooth Bezier Chain</SelectItem>
            <SelectItem value="step">Step (Orthogonal)</SelectItem>
            <SelectItem value="catmull-rom-polyline">Catmull-Rom Polyline</SelectItem>
            <SelectItem value="catmull-rom-bezier">Catmull-Rom Bezier</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground leading-tight">
          {config.renderMode === 'bezier-chain' && 'Smooth curves through anchors, no wobbles'}
          {config.renderMode === 'step' && 'Orthogonal routing with rounded corners'}
          {config.renderMode === 'catmull-rom-polyline' && 'Exact but may wobble on straight sections'}
          {config.renderMode === 'catmull-rom-bezier' && 'Compact SVG, may have kinks at anchors'}
        </p>
      </div>

      {/* Curve Type Selector - only for Catmull-Rom modes */}
      {(config.renderMode === 'catmull-rom-polyline' || config.renderMode === 'catmull-rom-bezier') && (
        <div className="space-y-2">
          <Label className="text-xs">Curve Type</Label>
          <Select value={config.curveType} onValueChange={handleCurveTypeChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="centripetal">Centripetal (Recommended)</SelectItem>
              <SelectItem value="uniform">Uniform</SelectItem>
              <SelectItem value="chordal">Chordal</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Centripetal prevents cusps and self-intersections
          </p>
        </div>
      )}

      {/* Alpha - only for Catmull-Rom modes */}
      {(config.renderMode === 'catmull-rom-polyline' || config.renderMode === 'catmull-rom-bezier') && (
        <SliderWithInput
          label="Alpha"
          value={config.alpha}
          min={0}
          max={1}
          step={0.05}
          onChange={v => setConfig({ alpha: v })}
          hint="0=uniform, 0.5=centripetal, 1=chordal"
        />
      )}

      {/* Curvature - only for Bezier Chain mode */}
      {config.renderMode === 'bezier-chain' && (
        <SliderWithInput
          label="Curvature"
          value={config.curvature}
          min={0.1}
          max={1}
          step={0.05}
          onChange={v => setConfig({ curvature: v })}
          hint="Controls bend strength (higher = more curved)"
        />
      )}

      {/* Border Radius - only for Step mode */}
      {config.renderMode === 'step' && (
        <SliderWithInput
          label="Border Radius"
          value={config.borderRadius}
          min={0}
          max={50}
          step={2}
          onChange={v => setConfig({ borderRadius: v })}
          hint="Corner rounding (0=sharp, 50=very round)"
        />
      )}

      {/* Smoothness - only for Catmull-Rom Polyline mode */}
      {config.renderMode === 'catmull-rom-polyline' && (
        <SliderWithInput
          label="Smoothness"
          value={config.smoothness}
          min={10}
          max={50}
          step={5}
          onChange={v => setConfig({ smoothness: v })}
          hint="Points per segment (higher = smoother)"
        />
      )}

      {/* Tension - only for Catmull-Rom Bezier mode */}
      {config.renderMode === 'catmull-rom-bezier' && (
        <SliderWithInput
          label="Tension"
          value={config.tension}
          min={0.1}
          max={3}
          step={0.1}
          onChange={v => setConfig({ tension: v })}
          hint="Higher = tighter curves"
        />
      )}

      {/* Virtual Anchor Section - only for curved modes */}
      {config.renderMode !== 'step' && (
        <>
          <Separator className="my-4" />
          <h4 className="text-xs font-medium text-muted-foreground">Virtual Anchors (S-Curve)</h4>

          <SliderWithInput
            label="Max Offset"
            value={config.virtualAnchorMaxOffset}
            min={50}
            max={2000}
            step={50}
            onChange={v => setConfig({ virtualAnchorMaxOffset: v })}
            hint="Maximum distance for S-curve (px)"
          />

          <SliderWithInput
            label="Reference Distance"
            value={config.virtualAnchorRefDistance}
            min={50}
            max={1000}
            step={25}
            onChange={v => setConfig({ virtualAnchorRefDistance: v })}
            hint="Distance at which full offset is used"
          />

          <SliderWithInput
            label="Scaling Power"
            value={config.virtualAnchorPower}
            min={0.2}
            max={2}
            step={0.1}
            onChange={v => setConfig({ virtualAnchorPower: v })}
            hint="0.5=sqrt (gentle), 1=linear, 2=quadratic"
          />
        </>
      )}

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-4 text-xs h-7"
        onClick={() => resetConfig()}
      >
        Reset to Defaults
      </Button>
    </div>
  )
}

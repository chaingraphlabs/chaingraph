/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createEvent, createStore, sample } from 'effector'

export type CurveType = 'uniform' | 'centripetal' | 'chordal'
export type RenderMode = 'bezier-chain' | 'step' | 'catmull-rom-polyline' | 'catmull-rom-bezier'

export interface CurveConfig {
  // Rendering
  renderMode: RenderMode

  // Parameterization (Catmull-Rom modes only)
  curveType: CurveType
  alpha: number

  // Bezier Chain mode
  curvature: number

  // Catmull-Rom Bezier mode
  tension: number

  // Catmull-Rom Polyline mode
  smoothness: number

  // Step mode
  borderRadius: number

  // Virtual anchors (curved modes only)
  virtualAnchorMaxOffset: number
  virtualAnchorRefDistance: number
  virtualAnchorPower: number
}

export const DEFAULT_CURVE_CONFIG: CurveConfig = {
  renderMode: 'bezier-chain',
  curveType: 'centripetal',
  alpha: 0.5,
  curvature: 0.33,
  tension: 1.0,
  smoothness: 20,
  borderRadius: 8,
  virtualAnchorMaxOffset: 1000,
  virtualAnchorRefDistance: 300,
  virtualAnchorPower: 0.5,
}

const STORAGE_KEY = 'chaingraph:curve-config'

// Events
export const setCurveConfig = createEvent<Partial<CurveConfig>>()
export const resetCurveConfig = createEvent()
export const curveConfigChanged = createEvent() // Fired when config changes (for edge re-renders)

// Load from localStorage
function loadConfig(): CurveConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<CurveConfig>
      return { ...DEFAULT_CURVE_CONFIG, ...parsed }
    }
  } catch (e) {
    console.error('[CurveConfig] Failed to load from localStorage:', e)
  }
  return DEFAULT_CURVE_CONFIG
}

// Store
export const $curveConfig = createStore<CurveConfig>(loadConfig())
  .on(setCurveConfig, (state, partial) => ({ ...state, ...partial }))
  .on(resetCurveConfig, () => DEFAULT_CURVE_CONFIG)

// Sync curveType → alpha (when curveType changes, update alpha to match)
sample({
  clock: setCurveConfig,
  source: $curveConfig,
  filter: (_, payload) => 'curveType' in payload && !('alpha' in payload),
  fn: (config) => {
    const alphaMap: Record<CurveType, number> = {
      uniform: 0,
      centripetal: 0.5,
      chordal: 1.0,
    }
    return { alpha: alphaMap[config.curveType] }
  },
  target: setCurveConfig,
})

// Fire curveConfigChanged event whenever config changes
sample({
  clock: [setCurveConfig, resetCurveConfig],
  target: curveConfigChanged,
})

// Save to localStorage on every change
$curveConfig.watch((config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (e) {
    console.error('[CurveConfig] Failed to save to localStorage:', e)
  }
})

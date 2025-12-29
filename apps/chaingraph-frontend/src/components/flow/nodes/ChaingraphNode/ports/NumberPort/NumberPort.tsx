/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NumberPortConfig } from '@badaitech/chaingraph-types'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import { NumberInput } from '@/components/ui/number-input'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useExecutionID, usePortConfigWithExecution, usePortUIWithExecution, usePortValueWithExecution } from '@/store/execution'
import { useFocusTracking } from '@/store/focused-editors/hooks/useFocusTracking'
import { usePortEdges } from '@/store/nodes/computed'
import { requestUpdatePortUI, requestUpdatePortValue, requestUpdatePortValueThrottled } from '@/store/ports'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface NumberPortProps {
  nodeId: string
  portId: string
}

function NumberPortInner(props: NumberPortProps) {
  const { nodeId, portId } = props

  // Granular subscriptions - only re-renders when THIS port's data changes
  const config = usePortConfigWithExecution(nodeId, portId)
  const ui = usePortUIWithExecution(nodeId, portId)
  const storeValue = usePortValueWithExecution(nodeId, portId) as number | undefined

  const title = config?.title || config?.key || portId
  const executionID = useExecutionID()

  // ============================================================================
  // LOCAL STATE FOR SMOOTH INPUT (both NumberInput and Slider)
  // ============================================================================
  // Pattern: Dual state with useRef tracking (proven production pattern)
  //
  // Problem: useState for editing flags causes race conditions between local
  // state and store state during optimistic updates.
  //
  // Solution: Use useRef to track editing state without triggering re-renders.
  // The ref prevents useEffect from syncing during the window between local
  // update and store update completion.
  // ============================================================================

  const [localValue, setLocalValue] = useState(storeValue ?? 0)
  const isEditingRef = useRef(false)
  const sliderTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Sync store → local ONLY when not actively editing
  // useRef ensures this check is stable and doesn't race with optimistic updates
  useEffect(() => {
    if (!isEditingRef.current && storeValue !== localValue) {
      setLocalValue(storeValue ?? 0)
    }
  }, [storeValue]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track focus/blur for global copy-paste functionality
  const { handleFocus: trackFocus, handleBlur: trackBlur } = useFocusTracking(nodeId, portId)

  // Granular edge subscription - only re-renders when THIS port's edges change
  const connectedEdges = usePortEdges(nodeId, portId)

  const needRenderEditor = useMemo(() => {
    if (!config)
      return false
    return !isHideEditor(config as any, connectedEdges)
  }, [config, connectedEdges])

  // Handler for number input - uses local state + non-throttled update
  // Each keystroke is meaningful (not continuous like slider), so no throttling
  const handleNumberInputChange = useCallback(({ floatValue }, sourceInfo: any) => {
    if (!sourceInfo.event?.isTrusted) {
      return
    }

    const val = floatValue ?? Number.NaN
    const newValue = Number.isNaN(val) ? undefined : val

    // Mark as editing to prevent store sync
    isEditingRef.current = true

    // Update local state immediately (synchronous)
    setLocalValue(newValue ?? 0)

    // Request immediate server sync (no throttle for discrete input)
    requestUpdatePortValue({
      nodeId,
      portId,
      value: newValue,
    })
  }, [nodeId, portId])

  // Handler for slider - uses local state + throttled update
  // Continuous input, so we throttle server sync while keeping instant local feedback
  const handleSliderChange = useCallback((values: number[]) => {
    const newValue = values[0]

    // Mark as editing to prevent store sync during drag
    isEditingRef.current = true

    // Update local state immediately (synchronous, no re-render delay)
    setLocalValue(newValue)

    // Request throttled server sync
    requestUpdatePortValueThrottled({
      nodeId,
      portId,
      value: newValue,
    })

    // Clear previous timeout
    if (sliderTimeoutRef.current) {
      clearTimeout(sliderTimeoutRef.current)
    }

    // Clear editing flag after throttle duration + buffer
    // This ensures store update has completed before we allow syncing again
    sliderTimeoutRef.current = setTimeout(() => {
      isEditingRef.current = false
    }, 600) // Slightly longer than PORT_VALUE_THROTTLE_MS to ensure completion
  }, [nodeId, portId])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current)
      }
    }
  }, [])

  if (ui?.hidden)
    return null

  // Early return if config not loaded yet
  if (!config)
    return null

  // Type-narrow to NumberPortConfig to access min/max/step properties
  const numberConfig = config as NumberPortConfig

  // Cast UI to proper type for type-safe property access
  const numberUI = ui as NumberPortConfig['ui'] || {}

  return (
    <div
      key={config.id}
      className={cn(
        'w-full',
        'relative flex gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
        // className,
      )}
    >
      {(config.direction === 'input' || config.direction === 'passthrough')
        && <PortHandle nodeId={nodeId} portId={portId} forceDirection="input" />}

      <div className={cn(
        'w-full',
        'flex flex-col',
        config.direction === 'output' ? 'items-end' : 'items-start',
      )}
      >
        <PortTitle
          className={cn(
            'cursor-pointer',
            'truncate',
            // if port required and the value is empty, add a red underline
            // Use storeValue for validation (not localValue)
            config.required
            && (storeValue === undefined || storeValue === null)
            && (config.direction === 'input' || config.direction === 'passthrough')
            && 'underline decoration-red-500 decoration-2',
          )}
          onClick={() => {
            requestUpdatePortUI({
              nodeId,
              portId,
              ui: {
                hideEditor: ui?.hideEditor === undefined ? !needRenderEditor : !ui.hideEditor,
              },
            })
          }}
        >
          {title}
        </PortTitle>

        {needRenderEditor && (
          <div className={cn(
            'w-full',
          )}
          >
            <NumberInput
              disabled={executionID ? true : numberUI.disabled ?? false}
              className={cn(
                // errorMessage && 'border-red-500',
                'w-full',
                'nodrag nopan',
              )}
              value={localValue}
              min={numberConfig.min}
              max={numberConfig.max}
              step={numberConfig.step}
              onValueChange={handleNumberInputChange}
              onFocus={() => {
                isEditingRef.current = true
                trackFocus()
              }}
              onBlur={() => {
                isEditingRef.current = false
                trackBlur()
                // Sync from store on blur in case value differs
                if (storeValue !== localValue) {
                  setLocalValue(storeValue ?? 0)
                }
              }}
            />

            {numberUI.isSlider && (
              <>
                {(numberUI.leftSliderLabel || numberUI.rightSliderLabel) && (
                  <div className="flex justify-between w-full text-xs text-gray-500">
                    <span>{numberUI.leftSliderLabel}</span>
                    <span>{numberUI.rightSliderLabel}</span>
                  </div>
                )}
                <Slider
                  className={cn('mt-2 w-full')}
                  disabled={executionID ? true : numberUI.disabled ?? false}
                  value={[localValue]}
                  min={numberConfig.min}
                  max={numberConfig.max}
                  step={numberConfig.step}
                  onValueChange={handleSliderChange}
                  onPointerDown={() => {
                    isEditingRef.current = true
                  }}
                  onPointerUp={() => {
                    // Don't immediately clear editing flag - the timeout in handleSliderChange
                    // will clear it after throttle completes
                    // This prevents store sync during the throttle window
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>

      {(config.direction === 'output' || config.direction === 'passthrough')
        && (
          <PortHandle
            nodeId={nodeId}
            portId={portId}
            forceDirection="output"
            className={cn(
              config.parentId !== undefined
              && config.direction === 'passthrough'
              && '-right-8',
            )}
          />
        )}
    </div>
  )
}

/**
 * Memoized NumberPort - only re-renders when port value, UI config, or context changes
 */
export const NumberPort = memo(NumberPortInner)

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { StringPortConfig } from '@badaitech/chaingraph-types'
import type { ChangeEvent, PropsWithChildren } from 'react'
// import { useStore } from '@xyflow/react'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useExecutionID } from '@/store/execution'
import { useFocusTracking } from '@/store/focused-editors/hooks/useFocusTracking'
import { usePortEdges } from '@/store/nodes/computed'
import { requestUpdatePortUI, requestUpdatePortValue } from '@/store/ports'
import { usePortConfig, usePortUI, usePortValue } from '@/store/ports-v2'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'
import { HTMLPreview } from './HTMLPreview'
import { MarkdownPreview } from './MarkdownPreview'

export interface StringPortProps {
  nodeId: string
  portId: string
}

// const zoomSelector = s => s.transform[2] ?? 1

function StringPortInner(props: PropsWithChildren<StringPortProps>) {
  const executionID = useExecutionID()
  const { nodeId, portId } = props

  // Granular subscriptions - only re-renders when THIS port's data changes
  const config = usePortConfig(nodeId, portId)
  const ui = usePortUI(nodeId, portId)
  const storeValue = usePortValue(nodeId, portId) as string | undefined

  // Granular edge subscription - only re-renders when THIS port's edges change
  const connectedEdges = usePortEdges(nodeId, portId)

  // ============================================================================
  // LOCAL STATE FOR CURSOR POSITION PRESERVATION
  // ============================================================================
  // Problem: Controlled components lose cursor position on re-render when value
  // comes from external store. When user types in the middle of text, store update
  // triggers re-render and cursor jumps to end.
  //
  // Solution: Maintain local state for immediate DOM updates. Only sync from store
  // when NOT focused (user not actively editing). This preserves cursor position
  // while still reflecting external changes (e.g., from other users).
  // ============================================================================

  const [localValue, setLocalValue] = useState(storeValue ?? '')
  const [inputFocused, setInputFocused] = useState(false)
  const [textareaFocused, setTextareaFocused] = useState(false)

  // Sync store → local ONLY when not focused
  // This allows external updates (other users, server corrections) to appear
  // while preserving cursor position during active editing
  // NOTE: localValue is NOT in dependency array to avoid racing with optimistic updates
  useEffect(() => {
    const isAnyFocused = inputFocused || textareaFocused
    if (!isAnyFocused && storeValue !== localValue) {
      setLocalValue(storeValue ?? '')
    }
  }, [storeValue, inputFocused, textareaFocused]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track focus/blur for global copy-paste functionality
  const { handleFocus: trackFocus, handleBlur: trackBlur } = useFocusTracking(nodeId, portId)

  const handleChange = useCallback(<Element extends HTMLInputElement | HTMLTextAreaElement>(e: ChangeEvent<Element>) => {
    if (!e.nativeEvent.isTrusted) {
      return
    }

    const newValue = e.target.value

    // Update local state immediately (preserves cursor position)
    setLocalValue(newValue)

    // Request store update (triggers optimistic update + server sync)
    requestUpdatePortValue({
      nodeId,
      portId,
      value: newValue,
    })
  }, [nodeId, portId])

  const needRenderEditor = useMemo(() => {
    if (!config)
      return false
    return !isHideEditor(config as any, connectedEdges)
  }, [config, connectedEdges])

  /*
   * Textarea resizing
   */
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // const handleResize = useCallback(() => {
  //   // get with and height of the textarea
  //   const { current: textarea } = textareaRef
  //   if (!textarea) {
  //     return
  //   }
  //   if (!config?.nodeId) {
  //     return
  //   }
  //
  //   const { width, height } = textarea.getBoundingClientRect()
  //
  //   // Using zoom directly from context
  //   const newDimensions = {
  //     width: Math.round(width / zoom),
  //     height: Math.round(height / zoom),
  //   }
  //   const isDimensionsChanged = (
  //     ui?.textareaDimensions?.width !== newDimensions.width
  //     || ui?.textareaDimensions?.height !== newDimensions.height
  //   )
  //   if (!isDimensionsChanged) {
  //     return
  //   }
  //
  //   requestUpdatePortUI({
  //     nodeId,
  //     portId,
  //     ui: {
  //       textareaDimensions: newDimensions,
  //     },
  //   })
  // }, [config, zoom, ui?.textareaDimensions?.width, ui?.textareaDimensions?.height, nodeId])

  if (ui?.hidden)
    return null

  // Early return if config not loaded yet
  if (!config)
    return null

  const title = config.title || config.key

  // Cast UI to proper type for type-safe property access
  const stringUI = ui as {
    isTextArea?: boolean
    isPassword?: boolean
    textareaDimensions?: { width?: number, height?: number }
    placeholder?: string
    renderMarkdown?: boolean
    markdownStyles?: {
      fontSize?: number
      lineHeight?: 'compact' | 'normal' | 'relaxed'
      maxHeight?: 'unlimited' | '200' | '400' | '600'
    }
    renderHtml?: boolean
    htmlStyles?: {
      height?: number
      autoHeight?: boolean
      maxHeight?: 'unlimited' | '400' | '600' | '800' | '1000'
      scale?: number
      showBorder?: boolean
      stripMarkdown?: boolean
      debounceDelay?: number
    }
    disabled?: boolean
    hideEditor?: boolean
  }

  return (
    <div
      key={config.id}
      className={cn(
        'relative flex gap-2 group/port',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
        // className,
      )}
    >
      {(config.direction === 'input' || config.direction === 'passthrough')
        && (
          <PortHandle nodeId={nodeId} portId={portId} forceDirection="input" />
        )}

      <div className={cn(
        'flex flex-col w-full',
        config.direction === 'output' ? 'items-end' : 'items-start',
      )}
      >
        <PortTitle
          className={cn(
            'cursor-pointer',
            'truncate',
            // if port required and the value is empty, add a red underline
            // Use storeValue for validation (not localValue) to show actual persisted state
            config.required
            && !storeValue
            && (config.direction === 'input' || config.direction === 'passthrough')
            && 'underline decoration-red-500 decoration-2',
          )}
          onClick={() => {
            requestUpdatePortUI({
              nodeId,
              portId,
              ui: {
                hideEditor: stringUI.hideEditor === undefined ? true : !stringUI.hideEditor,
              },
            })
          }}
        >
          {title}
        </PortTitle>

        {!stringUI.isTextArea && needRenderEditor && (
          <Input
            value={localValue}
            onChange={handleChange}
            onFocus={() => {
              setInputFocused(true)
              trackFocus()
            }}
            onBlur={() => {
              setInputFocused(false)
              trackBlur()
              // Sync final value on blur in case store differs
              if (storeValue !== localValue) {
                setLocalValue(storeValue ?? '')
              }
            }}
            className={cn(
              'resize-none shadow-none text-xs p-1',
              'w-full',
              // errorMessage && 'border-red-500',
              'nodrag',
              'placeholder:text-neutral-400 placeholder:opacity-40',
            )}
            placeholder={
              stringUI.placeholder
              ?? config.title
              ?? config.key
              ?? 'Text'
            }
            type={stringUI.isPassword ? 'password' : undefined}
            data-1p-ignore
            disabled={executionID ? true : stringUI.disabled ?? false}
          />
        )}

        {stringUI.isTextArea && needRenderEditor && (
          <>
            <Textarea
              ref={textareaRef}
              value={localValue}
              onChange={handleChange}
              // onClick={_ => handleResize()}
              // onInput={_ => handleResize()}
              onBlur={() => {
                // handleResize()
                setTextareaFocused(false)
                trackBlur()
                // Sync final value on blur in case store differs
                if (storeValue !== localValue) {
                  setLocalValue(storeValue ?? '')
                }
              }}
              onFocus={() => {
                // handleResize()
                setTextareaFocused(true)
                trackFocus()
              }}
              style={{
                //   width: stringUI.textareaDimensions?.width ? `${Math.round(stringUI.textareaDimensions.width)}px` : undefined,
                height: stringUI.textareaDimensions?.height ? `${Math.round(stringUI.textareaDimensions.height)}px` : undefined,
              }}
              className={cn(
                'shadow-none text-xs p-1 resize',
                'nodrag',
                'w-full',
                'max-w-full',
                textareaFocused && 'nowheel',
                'placeholder:text-neutral-400 placeholder:opacity-40',
              )}
              placeholder={
                stringUI.placeholder
                ?? config.title
                ?? config.key
                ?? 'Text'
              }
              disabled={executionID ? true : stringUI.disabled ?? false}
            />
          </>
        )}

        {/* Markdown preview - renders below the editor when enabled */}
        {/* Use localValue for immediate preview feedback while typing */}
        {stringUI.renderMarkdown && localValue && (
          <MarkdownPreview
            content={localValue}
            nodeId={nodeId}
            portId={portId}
            styles={stringUI.markdownStyles}
          />
        )}

        {/* HTML preview - renders in sandboxed iframe when enabled */}
        {/* Use localValue for immediate preview feedback while typing */}
        {stringUI.renderHtml && localValue && (
          <HTMLPreview
            content={localValue}
            nodeId={nodeId}
            portId={portId}
            styles={stringUI.htmlStyles}
          />
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
 * Memoized StringPort - only re-renders when port value, visibility, or context changes
 */
export const StringPort = memo(StringPortInner)

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort, StringPortConfig } from '@badaitech/chaingraph-types'
import type { ChangeEvent, PropsWithChildren } from 'react'
import type {
  PortContextValue,
} from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext'
// import { useStore } from '@xyflow/react'
import {
  memo,
  useCallback,
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
import { requestUpdatePortUI } from '@/store/ports'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'
import { MarkdownPreview } from './MarkdownPreview'

export interface StringPortProps {
  node: INode
  port: IPort<StringPortConfig>
  context: PortContextValue
}

// const zoomSelector = s => s.transform[2] ?? 1

function StringPortInner(props: PropsWithChildren<StringPortProps>) {
  const executionID = useExecutionID()
  const { node, port, context } = props
  const {
    updatePortValue,
    updatePortUI,
    getEdgesForPort,
  } = context

  const config = port.getConfig()
  const ui = useMemo(() => config.ui, [config.ui])

  // const zoom = useStore(zoomSelector)

  // Memoize connected edges to prevent unnecessary calculations
  const connectedEdges = useMemo(() => {
    return getEdgesForPort(port.id)
  }, [getEdgesForPort, port.id])

  const [focused, setFocused] = useState(false)

  // Track focus/blur for global copy-paste functionality
  const { handleFocus: trackFocus, handleBlur: trackBlur } = useFocusTracking(node.id, port.id)

  const handleChange = useCallback(<Element extends HTMLInputElement | HTMLTextAreaElement>(e: ChangeEvent<Element>) => {
    if (!e.nativeEvent.isTrusted) {
      return
    }

    const value = e.target.value

    updatePortValue({
      nodeId: node.id,
      portId: port.id,
      value,
    })
  }, [node.id, port.id, updatePortValue])

  const needRenderEditor = useMemo(() => {
    return !isHideEditor(config, connectedEdges)
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
  //   if (!port.getConfig().nodeId) {
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
  //     nodeId: node.id,
  //     portId: port.id,
  //     ui: {
  //       textareaDimensions: newDimensions,
  //     },
  //   })
  // }, [port, zoom, ui?.textareaDimensions?.width, ui?.textareaDimensions?.height, node.id])

  if (ui?.hidden)
    return null

  const title = config.title || config.key

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
          <PortHandle port={port} forceDirection="input" />
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
            config.required
            && (!port.getValue() || !port.validate())
            && (config.direction === 'input' || config.direction === 'passthrough')
            && (config.connections?.length || 0) === 0
            && 'underline decoration-red-500 decoration-2',
          )}
          onClick={() => {
            requestUpdatePortUI({
              nodeId: node.id,
              portId: port.id,
              ui: {
                hideEditor: ui?.hideEditor === undefined ? true : !ui.hideEditor,
              },
            })
          }}
        >
          {title}
        </PortTitle>

        {!ui?.isTextArea && needRenderEditor && (
          <Input
            value={port.getValue() ?? ''}
            onChange={handleChange}
            onFocus={trackFocus}
            onBlur={trackBlur}
            className={cn(
              'resize-none shadow-none text-xs p-1',
              'w-full',
              // errorMessage && 'border-red-500',
              'nodrag',
              'placeholder:text-neutral-400 placeholder:opacity-40',
            )}
            placeholder={
              config.ui?.placeholder
              ?? config.title
              ?? config.key
              ?? 'Text'
            }
            type={ui?.isPassword ? 'password' : undefined}
            data-1p-ignore
            disabled={executionID ? true : ui?.disabled ?? false}
          />
        )}

        {ui?.isTextArea && needRenderEditor && (
          <>
            <Textarea
              ref={textareaRef}
              value={port.getValue() ?? ''}
              onChange={handleChange}
              // onClick={_ => handleResize()}
              // onInput={_ => handleResize()}
              onBlur={(_) => {
                // handleResize()
                setFocused(false)
                trackBlur()
              }}
              onFocus={(_) => {
                // handleResize()
                setFocused(true)
                trackFocus()
              }}
              style={{
                //   width: ui?.textareaDimensions?.width ? `${Math.round(ui.textareaDimensions.width)}px` : undefined,
                height: ui?.textareaDimensions?.height ? `${Math.round(ui.textareaDimensions.height)}px` : undefined,
              }}
              className={cn(
                'shadow-none text-xs p-1 resize',
                'nodrag',
                'w-full',
                'max-w-full',
                focused && 'nowheel',
                'placeholder:text-neutral-400 placeholder:opacity-40',
              )}
              placeholder={
                config.ui?.placeholder
                ?? config.title
                ?? config.key
                ?? 'Text'
              }
              disabled={executionID ? true : ui?.disabled ?? false}
            />
          </>
        )}

        {/* Markdown preview - renders below the editor when enabled */}
        {ui?.renderMarkdown && port.getValue() && (
          <MarkdownPreview
            content={port.getValue() ?? ''}
            nodeId={node.id}
            portId={port.id}
            styles={ui?.markdownStyles}
          />
        )}
      </div>

      {(config.direction === 'output' || config.direction === 'passthrough')
        && (
          <PortHandle
            port={port}
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
export const StringPort = memo(StringPortInner, (prev, next) => {
  // Port value changed
  if (prev.port.getValue() !== next.port.getValue()) {
    return false
  }

  // Context changed (affects edge connections and editor visibility)
  if (prev.context !== next.context) {
    return false
  }

  // Hidden state changed
  if (prev.port.getConfig().ui?.hidden !== next.port.getConfig().ui?.hidden) {
    return false
  }

  // Editor visibility changed
  if (prev.port.getConfig().ui?.hideEditor !== next.port.getConfig().ui?.hideEditor) {
    return false
  }

  // Disabled state changed
  if (prev.port.getConfig().ui?.disabled !== next.port.getConfig().ui?.disabled) {
    return false
  }

  // Markdown rendering state changed
  if (prev.port.getConfig().ui?.renderMarkdown !== next.port.getConfig().ui?.renderMarkdown) {
    return false
  }

  // Markdown styles changed (deep comparison)
  const prevStyles = prev.port.getConfig().ui?.markdownStyles
  const nextStyles = next.port.getConfig().ui?.markdownStyles
  if (prevStyles?.fontSize !== nextStyles?.fontSize) return false
  if (prevStyles?.lineHeight !== nextStyles?.lineHeight) return false
  if (prevStyles?.maxHeight !== nextStyles?.maxHeight) return false

  // Node or port ID changed
  if (prev.node.id !== next.node.id || prev.port.id !== next.port.id) {
    return false
  }

  // Skip re-render - nothing important changed
  return true
})

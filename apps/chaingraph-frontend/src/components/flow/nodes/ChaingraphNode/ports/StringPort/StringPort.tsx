/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  PortContextValue,
} from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext'
/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { INode, IPort, StringPortConfig } from '@badaitech/chaingraph-types'
import type { ChangeEvent, PropsWithChildren } from 'react'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useExecutionID } from '@/store/execution'
import { useStore } from '@xyflow/react'
import {

  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'

export interface StringPortProps {
  node: INode
  port: IPort<StringPortConfig>
  context: PortContextValue
}

const zoomSelector = s => s.transform[2] ?? 1

export function StringPort(props: PropsWithChildren<StringPortProps>) {
  const executionID = useExecutionID()
  const { node, port, context } = props
  const {
    updatePortValue,
    updatePortUI,
    getEdgesForPort,
  } = context

  const config = port.getConfig()
  const ui = useMemo(() => config.ui, [config.ui])

  const zoom = useStore(zoomSelector)

  // Memoize connected edges to prevent unnecessary calculations
  const connectedEdges = useMemo(() => {
    return getEdgesForPort(port.id)
  }, [getEdgesForPort, port.id])

  const [focused, setFocused] = useState(false)

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
  const handleResize = useCallback(() => {
    // get with and height of the textarea
    const { current: textarea } = textareaRef
    if (!textarea) {
      return
    }
    if (!port.getConfig().nodeId) {
      return
    }

    const { width, height } = textarea.getBoundingClientRect()

    // Using zoom directly from context
    const newDimensions = {
      width: Math.round(width / zoom),
      height: Math.round(height / zoom),
    }
    const isDimensionsChanged = (
      ui?.textareaDimensions?.width !== newDimensions.width
      || ui?.textareaDimensions?.height !== newDimensions.height
    )
    if (!isDimensionsChanged) {
      return
    }

    updatePortUI({
      nodeId: node.id,
      portId: port.id,
      ui: {
        textareaDimensions: newDimensions,
      },
    })
  }, [port, zoom, ui?.textareaDimensions?.width, ui?.textareaDimensions?.height, node.id, updatePortUI])

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
      {config.direction === 'input'
        && (
          <PortHandle port={port} />
        )}

      <div className={cn(
        'flex flex-col w-full',
        config.direction === 'output' ? 'items-end' : 'items-start',
        'truncate',
      )}
      >
        <PortTitle>
          {title}
          {' '}
        </PortTitle>

        {!ui?.isTextArea && needRenderEditor && (
          <Input
            value={port.getValue()}
            onChange={handleChange}
            className={cn(
              'resize-none shadow-none text-xs p-1',
              'w-full',
              // errorMessage && 'border-red-500',
              'nodrag',
              'placeholder:text-neutral-400 placeholder:opacity-40',
            )}
            placeholder={
              port.getConfig().ui?.placeholder
              ?? port.getConfig().title
              ?? port.getConfig().key
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
              value={port.getValue()}
              onChange={handleChange}
              onClick={_ => handleResize()}
              onInput={_ => handleResize()}
              onBlur={(_) => {
                handleResize()
                setFocused(false)
              }}
              onFocus={(_) => {
                handleResize()
                setFocused(true)
              }}
              style={{
                width: ui?.textareaDimensions?.width ? `${Math.round(ui.textareaDimensions.width)}px` : undefined,
                height: ui?.textareaDimensions?.height ? `${Math.round(ui.textareaDimensions.height)}px` : undefined,
              }}
              className={cn(
                'shadow-none text-xs p-1 resize',
                'nodrag',
                'max-w-full',
                focused && 'nowheel',
                'placeholder:text-neutral-400 placeholder:opacity-40',
              )}
              placeholder={
                port.getConfig().ui?.placeholder
                ?? port.getConfig().title
                ?? port.getConfig().key
                ?? 'Text'
              }
              disabled={executionID ? true : ui?.disabled ?? false}
            />
          </>
        )}
      </div>

      {config.direction === 'output'
        && (
          <PortHandle port={port} />
        )}
    </div>
  )
}

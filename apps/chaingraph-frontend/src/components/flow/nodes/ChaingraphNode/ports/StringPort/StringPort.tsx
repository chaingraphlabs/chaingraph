/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { INode, IPort, StringPortConfig } from '@badaitech/chaingraph-types'
import { isHideEditor } from '@/components/flow/nodes/ChaingraphNode/ports/utils/hide-editor'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { $activeFlowMetadata } from '@/store'
import { useEdgesForPort } from '@/store/edges/hooks/useEdgesForPort'
import { requestUpdatePortUI, requestUpdatePortValue } from '@/store/ports'
import { useReactFlow } from '@xyflow/react'
import { useUnit } from 'effector-react'
import {
  type ChangeEvent,
  type PropsWithChildren,
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
}

export function StringPort(props: PropsWithChildren<StringPortProps>) {
  const activeFlow = useUnit($activeFlowMetadata)
  const { node, port } = props

  const config = port.getConfig()
  const ui = useMemo(() => config.ui, [config.ui])
  const connectedEdges = useEdgesForPort(port.id)
  const { getZoom } = useReactFlow()

  const [focused, setFocused] = useState(false)

  const handleChange = <Element extends HTMLInputElement | HTMLTextAreaElement>(e: ChangeEvent<Element>) => {
    if (!e.nativeEvent.isTrusted) {
      return
    }

    const value = e.target.value

    requestUpdatePortValue({
      nodeId: node.id,
      portId: port.id,
      value,
    })
  }

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
    if (!activeFlow?.id || !port.getConfig().nodeId) {
      return
    }

    const { width, height } = textarea.getBoundingClientRect()

    const zoom = getZoom()
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

    console.log('StringPort handleResize', newDimensions)

    requestUpdatePortUI({
      nodeId: node.id,
      portId: port.id,
      ui: {
        textareaDimensions: newDimensions,
      },
    })
  }, [activeFlow?.id, port, getZoom, ui?.textareaDimensions?.width, ui?.textareaDimensions?.height, node.id])

  if (ui?.hide)
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
      )}
      >
        <PortTitle>
          {title}
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
            )}
            placeholder={port.getConfig().title ?? 'Text'}
            type={ui?.isPassword ? 'password' : undefined}
            data-1p-ignore
            disabled={ui?.disabled ?? false}
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
              )}
              placeholder="String"
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

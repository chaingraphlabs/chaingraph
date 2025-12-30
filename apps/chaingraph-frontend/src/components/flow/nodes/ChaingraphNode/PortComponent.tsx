/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { memo } from 'react'
import { usePortType } from '@/store/ports-v2'
import { AnyPort } from './ports/AnyPort/AnyPort'
import { ArrayPort } from './ports/ArrayPort/ArrayPort'
import { BooleanPort } from './ports/BooleanPort/BooleanPort'
import { EnumPort } from './ports/EnumPort/EnumPort'
import { NumberPort } from './ports/NumberPort/NumberPort'
import { ObjectPort } from './ports/ObjectPort/ObjectPort'
import { SecretPort } from './ports/SecretPort/SecretPort'
import { StreamPort } from './ports/StreamPort/StreamPort'
import { StringPort } from './ports/StringPort/StringPort'

/**
 * PortProps interface for all components rendered through PortComponent
 *
 * ID-ONLY ARCHITECTURE:
 * - No full node/port objects passed as props
 * - Port components fetch data via granular hooks (usePortValue, usePortConfig, etc.)
 * - Port components call Effector events directly (no context needed!)
 * - True granularity: Only Port A re-renders when Port A changes
 * - Memo becomes trivial (ID comparison only)
 */
export interface PortProps {
  nodeId: string
  portId: string
}

/**
 * Memoized PortComponent with trivial ID-only comparison
 * No version checks - granular hooks handle update detection
 */
export const PortComponent = memo(PortComponentInner, (prev, next) => {
  // Simple ID comparison - if IDs match, skip re-render
  // Granular hooks inside component handle data change detection
  if (prev.nodeId !== next.nodeId)
    return false
  if (prev.portId !== next.portId)
    return false
  return true // IDs match - skip re-render, let hooks decide
})

function PortComponentInner(props: PortProps) {
  const { nodeId, portId } = props

  // Fetch only the port type to avoid re-renders on unrelated config changes
  const portType = usePortType(nodeId, portId)

  // Early return if config not loaded
  if (!portType)
    return null

  switch (portType) {
    case 'string': {
      return (
        <StringPort nodeId={nodeId} portId={portId} />
      )
    }
    case 'boolean': {
      return (
        <BooleanPort nodeId={nodeId} portId={portId} />
      )
    }
    case 'number': {
      return (
        <NumberPort nodeId={nodeId} portId={portId} />
      )
    }
    case 'enum': {
      return (
        <EnumPort nodeId={nodeId} portId={portId} />
      )
    }
    case 'object': {
      return (
        <ObjectPort nodeId={nodeId} portId={portId} />
      )
    }
    case 'array': {
      return (
        <ArrayPort nodeId={nodeId} portId={portId} />
      )
    }
    case 'secret':
      return (
        <SecretPort nodeId={nodeId} portId={portId} />
      )

    case 'any': {
      return <AnyPort nodeId={nodeId} portId={portId} />
    }

    case 'stream': {
      return <StreamPort nodeId={nodeId} portId={portId} />
    }

    default: {
      throw new Error(`Unhandled port type case: ${String(portType)}`)
    }
  }
}

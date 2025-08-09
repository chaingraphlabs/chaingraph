/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AnyPortConfig, IPort, IPortConfig } from '../../base'
import { AnyPort } from '../../instances'

const MAX_UNWRAP_DEPTH = 10

/**
 * Resolve port configuration, handling AnyPort unwrapping
 */
export function resolvePortConfig(port: IPort): IPortConfig {
  if (port instanceof AnyPort) {
    const unwrapped = port.unwrapUnderlyingType()
    return unwrapped || port.getRawConfig()
  }
  return port.getConfig()
}

/**
 * Unwrap AnyPort to get underlying type configuration
 */
export function unwrapAnyPort(config: IPortConfig): IPortConfig | undefined {
  if (config.type !== 'any') {
    return config
  }

  const anyConfig = config as AnyPortConfig
  let underlyingType = anyConfig.underlyingType
  let depth = 0

  // Keep unwrapping nested 'any' types until we find a concrete type
  while (
    underlyingType
    && underlyingType.type === 'any'
    && (underlyingType as AnyPortConfig).underlyingType
    && depth < MAX_UNWRAP_DEPTH
  ) {
    underlyingType = (underlyingType as AnyPortConfig).underlyingType
    depth++
  }

  if (depth >= MAX_UNWRAP_DEPTH) {
    console.warn('Maximum unwrap depth reached for AnyPort')
    return undefined
  }

  return underlyingType
}

/**
 * Get the effective type of a port (considering AnyPort unwrapping)
 */
export function getEffectiveType(config: IPortConfig): string {
  const unwrapped = config.type === 'any' ? unwrapAnyPort(config) : config
  return unwrapped?.type || 'any'
}

/**
 * Check if two port configurations have compatible types
 */
export function areTypesCompatible(source: IPortConfig, target: IPortConfig): boolean {
  const sourceType = getEffectiveType(source)
  const targetType = getEffectiveType(target)

  // Any can accept anything
  if (targetType === 'any')
    return true

  // Types must match
  return sourceType === targetType
}

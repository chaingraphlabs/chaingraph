/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from './types'
import { deepCopy } from '../../utils'
import { isArrayPortConfig } from './types'
import { isObjectPortConfig } from './types'

export function cleanupPortConfigFromIds(config: IPortConfig): IPortConfig {
  const { id, parentId, ...cleanedConfig } = deepCopy(config) as IPortConfig

  // Handle nested object types recursively
  if (isObjectPortConfig(cleanedConfig)) {
    // Clean nested schema properties recursively
    if (cleanedConfig.schema.properties) {
      const cleanedProperties: Record<string, IPortConfig> = {}
      for (const [key, value] of Object.entries(cleanedConfig.schema.properties)) {
        cleanedProperties[key] = cleanupPortConfigFromIds(value)
      }
      cleanedConfig.schema.properties = cleanedProperties
    }
  } else if (isArrayPortConfig(cleanedConfig)) {
    // Clean array items recursively
    cleanedConfig.itemConfig = cleanupPortConfigFromIds(cleanedConfig.itemConfig)
  }

  return cleanedConfig as IPortConfig
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArrayPortConfig, IPortConfig, ObjectPortConfig } from '@badaitech/chaingraph-types'

/**
 * Navigate object by path string
 * Supports: "a.b", "a[0]", "a.b[0].c"
 */
export function getByPath(obj: any, path: string): any {
  if (!path || !obj)
    return obj

  const parts = path.split('.').flatMap((part) => {
    const match = part.match(/^(.+?)\[(\d+)\]$/)
    if (match)
      return [match[1], match[2]]
    const arrayMatch = part.match(/^\[(\d+)\]$/)
    if (arrayMatch)
      return [arrayMatch[1]]
    return [part]
  }).filter(Boolean)

  return parts.reduce((acc, key) => {
    if (acc === null || acc === undefined)
      return undefined
    return acc[key]
  }, obj)
}

/**
 * Navigate type schema by path
 * Returns IPortConfig at the path location
 */
export function getTypeAtPath(config: IPortConfig, path: string): IPortConfig | undefined {
  if (!path)
    return config

  const parts = path.split('.').flatMap((part) => {
    const match = part.match(/^(.+?)\[(\d+)\]$/)
    return match ? [match[1], '[]'] : [part]
  }).filter(Boolean)

  let current: IPortConfig | undefined = config

  for (const part of parts) {
    if (!current)
      return undefined

    if (part === '[]' || part === '*') {
      if (current.type === 'array') {
        current = (current as ArrayPortConfig).itemConfig
      } else {
        return undefined
      }
    } else if (current.type === 'object') {
      const objConfig = current as ObjectPortConfig
      current = objConfig.schema?.properties?.[part]
    } else {
      return undefined
    }
  }

  return current
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Deep equality check for values and configurations
 * Used to prevent unnecessary updates when values haven't changed
 */
export function isDeepEqual(a: any, b: any): boolean {
  // Handle primitives and null/undefined
  if (a === b)
    return true
  if (a == null || b == null)
    return a === b
  if (typeof a !== 'object' || typeof b !== 'object')
    return a === b

  // Handle different types
  const typeA = Object.prototype.toString.call(a)
  const typeB = Object.prototype.toString.call(b)
  if (typeA !== typeB)
    return false

  // Handle Arrays
  if (Array.isArray(a)) {
    if (a.length !== b.length)
      return false
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i]))
        return false
    }
    return true
  }

  // Handle Dates
  if (a instanceof Date) {
    return a.getTime() === b.getTime()
  }

  // Handle RegExp
  if (a instanceof RegExp) {
    return a.toString() === b.toString()
  }

  // Handle Objects
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length)
    return false

  for (const key of keysA) {
    if (!keysB.includes(key))
      return false
    if (!isDeepEqual(a[key], b[key]))
      return false
  }

  return true
}

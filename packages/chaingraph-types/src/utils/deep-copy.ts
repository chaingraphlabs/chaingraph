/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { MultiChannel } from '@badaitech/chaingraph-types/port/channel'
import Decimal from 'decimal.js'

export function deepCopy(obj: any): any {
  let copy

  // Handle the 3 simple types, and null or undefined
  if (obj == null || typeof obj != 'object' || obj === undefined)
    return obj

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date()
    copy.setTime(obj.getTime())
    return copy
  }

  // Handle Array
  if (Array.isArray(obj)) {
    copy = []
    for (let i = 0, len = obj.length; i < len; i++) {
      copy[i] = deepCopy(obj[i])
    }
    return copy
  }

  if (Decimal.isDecimal(obj)) {
    return new Decimal(obj)
  }

  if (obj instanceof MultiChannel) {
    return obj.clone()
  }

  if (typeof obj === 'number') {
    return obj
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {}
    for (const attr in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, attr))
        (copy as any)[attr] = deepCopy(obj[attr])
    }

    // Copy type information
    return copy
  }

  throw new Error('Unable to copy obj! Its type isn\'t supported.')
}

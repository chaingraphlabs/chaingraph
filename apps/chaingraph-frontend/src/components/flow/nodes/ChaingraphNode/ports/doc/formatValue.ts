/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export function formatValue(value: any): string {
  if (
    value === undefined
    || value === null
    || (typeof value === 'string' && value.trim() === '')
  ) {
    return 'N/A'
  }

  try {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    // check if is an array
    if (Array.isArray(value)) {
      return JSON.stringify(value, null, 2)
    }

    return String(value)
  } catch (error) {
    return 'Complex value'
  }
}

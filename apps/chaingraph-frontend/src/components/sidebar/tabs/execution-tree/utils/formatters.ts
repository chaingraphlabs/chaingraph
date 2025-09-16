/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { formatDistanceToNow } from 'date-fns'

export function formatExecutionId(id: string): string {
  // Show first 8 characters after EX prefix
  if (id.startsWith('EX_')) {
    return `EX_${id.slice(3, 11)}...`
  }
  if (id.startsWith('EX')) {
    return `EX${id.slice(2, 10)}...`
  }
  return id.length > 12 ? `${id.slice(0, 12)}...` : id
}

export function formatDuration(start?: Date, end?: Date): string {
  if (!start)
    return '-'

  if (!end) {
    // Still running
    return formatDistanceToNow(new Date(start), { addSuffix: false })
  }

  const duration = new Date(end).getTime() - new Date(start).getTime()

  if (duration < 1000) {
    return `${duration}ms`
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`
  } else if (duration < 3600000) {
    return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`
  } else {
    return `${Math.floor(duration / 3600000)}h ${Math.floor((duration % 3600000) / 60000)}m`
  }
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  }).format(date)
}

export function formatEventPayload(payload: any): string {
  if (!payload)
    return ''

  if (typeof payload === 'string')
    return payload
  if (typeof payload === 'number')
    return payload.toString()
  if (typeof payload === 'boolean')
    return payload.toString()

  // Special handling for external events
  if (payload.source === 'external' && payload.events) {
    return `${payload.count} external event${payload.count > 1 ? 's' : ''}`
  }

  // For objects, show a compact representation
  const keys = Object.keys(payload)
  if (keys.length === 0)
    return '{}'
  if (keys.length === 1) {
    return `${keys[0]}: ${JSON.stringify(payload[keys[0]])}`
  }
  return `${keys.length} properties`
}

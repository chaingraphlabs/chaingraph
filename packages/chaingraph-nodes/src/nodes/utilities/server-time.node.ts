/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortNumber,
  PortString,
  PortVisibility,
  StringEnum,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

// Time format options
const TIME_FORMATS = {
  ISO: 'ISO',
  LOCALE: 'Locale',
  CUSTOM: 'Custom',
} as const

// Common timezone options
const TIMEZONES = {
  'UTC': 'UTC',
  'America/New_York': 'America/New_York',
  'America/Los_Angeles': 'America/Los_Angeles',
  'America/Chicago': 'America/Chicago',
  'Europe/London': 'Europe/London',
  'Europe/Paris': 'Europe/Paris',
  'Europe/Berlin': 'Europe/Berlin',
  'Asia/Tokyo': 'Asia/Tokyo',
  'Asia/Shanghai': 'Asia/Shanghai',
  'Asia/Kolkata': 'Asia/Kolkata',
  'Australia/Sydney': 'Australia/Sydney',
} as const

@Node({
  type: 'ServerTimeNode',
  title: 'Server Time',
  description: 'Returns the current server time in various formats with timezone support',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['time', 'date', 'timestamp', 'timezone', 'now'],
})
class ServerTimeNode extends BaseNode {
  @Input()
  @StringEnum(Object.values(TIME_FORMATS), {
    title: 'Time Format',
    description: 'Choose the format for the time output: ISO (ISO 8601), Locale (local format), or Custom',
    defaultValue: TIME_FORMATS.ISO,
    options: Object.values(TIME_FORMATS).map(format => ({
      id: format,
      title: format,
      type: 'string',
      defaultValue: format,
    })),
  })
  timeFormat: string = TIME_FORMATS.ISO

  @Input()
  @PortString({
    title: 'Custom Format',
    description: 'Custom format string (e.g., "YYYY-MM-DD HH:mm:ss", "MMM dd, yyyy h:mm a"). Only used when Time Format is set to Custom.',
    defaultValue: 'YYYY-MM-DD HH:mm:ss',
  })
  @PortVisibility({
    showIf: (node) => {
      const timeNode = node as ServerTimeNode
      return timeNode.timeFormat === TIME_FORMATS.CUSTOM
    },
  })
  customFormat: string = 'YYYY-MM-DD HH:mm:ss'

  @Input()
  @StringEnum(Object.values(TIMEZONES), {
    title: 'Timezone',
    description: 'Select the timezone for the formatted time output',
    defaultValue: 'UTC',
    options: Object.values(TIMEZONES).map(tz => ({
      id: tz,
      title: tz,
      type: 'string',
      defaultValue: tz,
    })),
  })
  timezone: string = 'UTC'

  @Output()
  @PortString({
    title: 'Formatted Time',
    description: 'The current server time formatted according to the selected format and timezone',
  })
  formattedTime: string = ''

  @Output()
  @PortNumber({
    title: 'Timestamp (seconds)',
    description: 'Current server time as Unix timestamp in seconds',
    integer: true,
  })
  timestampSeconds: number = 0

  @Output()
  @PortNumber({
    title: 'Timestamp (milliseconds)',
    description: 'Current server time as Unix timestamp in milliseconds',
    integer: true,
  })
  timestampMilliseconds: number = 0

  /**
   * Format a date using a simple custom format string
   * Supports basic patterns: YYYY, MM, DD, HH, mm, ss, MMM
   */
  private formatCustomDate(date: Date, format: string, timezone: string): string {
    // Create a date formatter with the specified timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }

    const formatter = new Intl.DateTimeFormat('en-CA', options) // en-CA gives YYYY-MM-DD format
    const parts = formatter.formatToParts(date)

    // Create a mapping of parts
    const partMap: Record<string, string> = {}
    parts.forEach((part) => {
      partMap[part.type] = part.value
    })

    // Handle month names (MMM) first before other replacements
    let result = format
    if (format.includes('MMM')) {
      const monthFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        month: 'short',
      })
      const monthName = monthFormatter.format(date)
      result = result.replace(/MMM/g, monthName)
    }

    // Simple format replacement
    result = result
      .replace(/YYYY/g, partMap.year || '')
      .replace(/MM/g, partMap.month || '')
      .replace(/DD/g, partMap.day || '')
      .replace(/HH/g, partMap.hour || '')
      .replace(/mm/g, partMap.minute || '')
      .replace(/ss/g, partMap.second || '')

    // Handle 12-hour format
    if (format.includes('h:') || format.includes('h ')) {
      const hour12Formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: true,
      })
      const hour12Parts = hour12Formatter.formatToParts(date)
      const hour12 = hour12Parts.find(p => p.type === 'hour')?.value || ''
      const dayPeriod = hour12Parts.find(p => p.type === 'dayPeriod')?.value || ''

      result = result.replace(/h/g, hour12).replace(/a/g, dayPeriod)
    }

    return result
  }

  async execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    const now = new Date()

    // Set timestamp outputs
    this.timestampSeconds = Math.floor(now.getTime() / 1000)
    this.timestampMilliseconds = now.getTime()

    // Format the time based on the selected format
    try {
      switch (this.timeFormat) {
        case TIME_FORMATS.ISO:
          // ISO 8601 format with timezone
          if (this.timezone === 'UTC') {
            this.formattedTime = now.toISOString()
          } else {
            // Convert to the specified timezone and format as ISO-like with proper offset
            const formatter = new Intl.DateTimeFormat('sv-SE', {
              timeZone: this.timezone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZoneName: 'longOffset',
            })
            const parts = formatter.formatToParts(now)
            const date = `${parts.find(p => p.type === 'year')?.value}-`
              + `${parts.find(p => p.type === 'month')?.value}-`
              + `${parts.find(p => p.type === 'day')?.value}`
            const time = `${parts.find(p => p.type === 'hour')?.value}:`
              + `${parts.find(p => p.type === 'minute')?.value}:`
              + `${parts.find(p => p.type === 'second')?.value}`
            const offset = parts.find(p => p.type === 'timeZoneName')?.value || '+00:00'
            this.formattedTime = `${date}T${time}${offset}`
          }
          break

        case TIME_FORMATS.LOCALE:
          // Locale-specific format
          this.formattedTime = new Intl.DateTimeFormat('en-US', {
            timeZone: this.timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
          }).format(now)
          break

        case TIME_FORMATS.CUSTOM:
          // Custom format
          if (this.customFormat.trim()) {
            this.formattedTime = this.formatCustomDate(now, this.customFormat, this.timezone)
          } else {
            this.formattedTime = this.formatCustomDate(now, 'YYYY-MM-DD HH:mm:ss', this.timezone)
          }
          break

        default:
          this.formattedTime = now.toISOString()
      }
    } catch (error) {
      // Fallback to ISO format if anything goes wrong
      this.formattedTime = now.toISOString()

      // Log the error for debugging
      console.warn('ServerTimeNode: Error formatting time, falling back to ISO format:', error)
    }

    return {}
  }
}

export default ServerTimeNode

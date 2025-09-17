/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import pino from 'pino'
import { config } from './config'

// Production logger - pure JSON output
const productionLogger = pino({
  level: config.logging.level,
  formatters: {
    level: label => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    pid: process.pid,
  },
})

// Development logger - conditionally use pino-pretty when available
const developmentLogger = (() => {
  if (!config.logging.pretty || process.env.NODE_ENV === 'production') {
    return productionLogger
  }

  try {
    return pino({
      level: config.logging.level,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    })
  } catch {
    // Fallback to production logger if pino-pretty is not available
    return productionLogger
  }
})()

// Export the appropriate logger based on environment
export const logger = process.env.NODE_ENV === 'production'
  ? productionLogger
  : developmentLogger

// Keep existing loggerJSON for backward compatibility
export const loggerJSON = productionLogger

export function createLogger(name: string) {
  return logger.child({ module: name })
}

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

export const logger = pino({
  level: config.logging.level,
  transport: config.logging.pretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
})

export const loggerJSON = pino({
  level: config.logging.level,
  formatters: { level: (label) => { return { level: label } } },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    pid: process.pid,
    // hostname: require('node:os').hostname(),
  },
})

export function createLogger(name: string) {
  return logger.child({ module: name })
}

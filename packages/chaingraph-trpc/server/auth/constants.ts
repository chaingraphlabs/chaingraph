/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'

/**
 * Demo user expiration period in days (configurable via DEMO_EXPIRY_DAYS env variable).
 * Default: 7 days
 * Valid range: 1-365 days
 *
 * Demo users expire after this many days from account creation.
 *
 * This is the single source of truth for demo expiration across:
 * - JWT token expiry (stateless validation)
 * - Database account expiry (account creation timestamp + DEMO_EXPIRY_DAYS)
 */
const rawDemoExpiryDays = process.env.DEMO_EXPIRY_DAYS
  ? Number.parseInt(process.env.DEMO_EXPIRY_DAYS, 10)
  : 7

// Validate range (1-365 days)
if (Number.isNaN(rawDemoExpiryDays) || rawDemoExpiryDays < 1 || rawDemoExpiryDays > 365) {
  throw new Error(
    `DEMO_EXPIRY_DAYS must be a number between 1 and 365 days, got: ${process.env.DEMO_EXPIRY_DAYS}`,
  )
}

export const DEMO_EXPIRY_DAYS = rawDemoExpiryDays

/**
 * Demo expiration in seconds.
 * Used for JWT token expiry configuration (jsonwebtoken library expects seconds).
 */
export const DEMO_EXPIRY_SECONDS = DEMO_EXPIRY_DAYS * 24 * 60 * 60

/**
 * Demo expiration in milliseconds.
 * Used for Date calculations in demo account expiry checks.
 */
export const DEMO_EXPIRY_MS = DEMO_EXPIRY_SECONDS * 1000

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import * as process from 'node:process'
import * as jwt from 'jsonwebtoken'
import { DEMO_EXPIRY_SECONDS } from './constants'

const DEMO_TOKEN_SECRET = process.env.DEMO_TOKEN_SECRET || 'chaingraph-demo-secret-change-in-production'
const DEMO_TOKEN_EXPIRY = DEMO_EXPIRY_SECONDS

export interface DemoTokenPayload {
  type: 'demo'
  demoId: string
  iat: number
  exp: number
}

/**
 * Sign a demo JWT token that expires after DEMO_EXPIRY_DAYS (7 days).
 * Token is stateless - no server-side session storage needed.
 *
 * @param demoId - The external ID for the demo account (nanoid)
 * @returns JWT token string prefixed with "demo_"
 */
export function signDemoToken(demoId: string): string {
  const payload: Omit<DemoTokenPayload, 'iat' | 'exp'> = {
    type: 'demo',
    demoId,
  }

  const token = jwt.sign(payload, DEMO_TOKEN_SECRET, {
    expiresIn: DEMO_TOKEN_EXPIRY,
  })

  return `demo_${token}`
}

/**
 * Verify and decode a demo JWT token.
 *
 * @param token - JWT token (with or without "demo_" prefix)
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyDemoToken(token: string): DemoTokenPayload {
  // Strip "demo_" prefix if present
  const cleanToken = token.startsWith('demo_') ? token.slice(5) : token

  // Verify JWT signature and expiry (throws JsonWebTokenError or TokenExpiredError if invalid)
  const decoded = jwt.verify(cleanToken, DEMO_TOKEN_SECRET) as DemoTokenPayload

  // Validate token type
  if (decoded.type !== 'demo') {
    throw new Error('Invalid token type')
  }

  return decoded
}

/**
 * Check if a token string looks like a demo token (starts with "demo_")
 */
export function isDemoToken(token: string): boolean {
  return token.startsWith('demo_')
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import * as dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

export interface AuthConfig {
  enabled: boolean
  devMode: boolean
  badaiAuth: {
    enabled: boolean
    apiUrl: string
  }
  // Future auth providers can be added here
}

export const authConfig: AuthConfig = {
  enabled: process.env.AUTH_ENABLED === 'true',
  devMode: process.env.AUTH_DEV_MODE === 'true' || process.env.NODE_ENV === 'development',
  badaiAuth: {
    enabled: process.env.BADAI_AUTH_ENABLED === 'true',
    apiUrl: process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
  },
}

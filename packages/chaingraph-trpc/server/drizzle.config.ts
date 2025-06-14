/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
import * as dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Check if .env file exists before trying to load it
const envPath = path.resolve(__dirname, '../../../.env')
const envExists = fs.existsSync(envPath)

if (envExists) {
  console.log(`Found .env file at ${envPath}, loading environment variables from file`)
  dotenv.config({ path: envPath })
} else {
  console.log('No .env file found, using environment variables directly')
}

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL environment variable is not set')
  console.warn('Please provide a valid DATABASE_URL environment variable or create a .env file')
}

export default defineConfig({
  out: './drizzle',
  schema: path.resolve(__dirname, './stores/postgres/schema.ts'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  },
  tablesFilter: [
    'chaingraph_*',
  ],
  strict: false,
  verbose: true,
  schemaFilter: 'public',
})

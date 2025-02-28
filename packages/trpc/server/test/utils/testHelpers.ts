/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow } from '@badaitech/chaingraph-types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Creates test flow metadata
 */
export function createTestFlowMetadata(overrides?: Partial<Flow['metadata']>) {
  return {
    name: 'Test Flow',
    description: 'Test Flow Description',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Generates random test ID
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${uuidv4()}`
}

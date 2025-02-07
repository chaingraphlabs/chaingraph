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

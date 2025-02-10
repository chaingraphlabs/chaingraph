/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { describe, expect, it } from 'vitest'
import { appRouter } from '../../../router'
import { createTestContext } from '../../../test/utils/createTestContext'
import { createTestFlowMetadata } from '../../../test/utils/testHelpers'
import { createCallerFactory } from '../../../trpc'

describe('flow Procedures', () => {
  // Create caller factory once
  const createCaller = createCallerFactory(appRouter)

  describe('create', () => {
    it('should create new flow with minimal metadata', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      const flow = await caller.flow.create({
        name: 'Test Flow',
      })
      if (!flow) {
        throw new Error('Flow creation failed')
      }

      expect(flow.id).toBeDefined()
      expect(typeof flow.id).toBe('string')
    })

    it('should create flow with full metadata', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      const metadata = createTestFlowMetadata({
        name: 'Full Metadata Flow',
        description: 'Test Description',
        tags: ['test', 'flow'],
      })

      const result = await caller.flow.create(metadata)
      if (!result) {
        throw new Error('Flow creation failed')
      }
      expect(result.id).toBeDefined()

      // Verify flow was created correctly
      const flow = await caller.flow.get(result.id!)
      expect(flow.metadata.name).toBe(metadata.name)
      expect(flow.metadata.description).toBe(metadata.description)
      expect(flow.metadata.tags).toEqual(metadata.tags)
    })
  })

  describe('get', () => {
    it('should get existing flow', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      // Create flow first
      const flow = await caller.flow.create({
        name: 'Test Flow',
      })

      if (!flow) {
        throw new Error('Flow creation failed')
      }

      // Get created flow
      expect(flow).toBeDefined()
      expect(flow.id).toBe(flow.id)
      expect(flow.name).toBe('Test Flow')
    })

    it('should throw error for non-existent flow', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      await expect(caller.flow.get('non-existent-id')).rejects.toThrow()
    })
  })

  describe('list', () => {
    it('should list all flows', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      // Create multiple flows
      await Promise.all([
        caller.flow.create({ name: 'Flow 1' }),
        caller.flow.create({ name: 'Flow 2' }),
        caller.flow.create({ name: 'Flow 3' }),
      ])

      const flows = await caller.flow.list()
      expect(flows).toHaveLength(3)
      expect(flows.map(f => f.name)).toEqual(['Flow 1', 'Flow 2', 'Flow 3'])
    })

    it('should return empty array when no flows exist', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      const flows = await caller.flow.list()
      expect(flows).toHaveLength(0)
    })
  })

  describe('delete', () => {
    it('should delete existing flow', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      // Create flow
      const flow = await caller.flow.create({
        name: 'Flow to Delete',
      })

      if (!flow) {
        throw new Error('Flow creation failed')
      }

      // Delete flow
      const result = await caller.flow.delete(flow.id!)
      expect(result.success).toBe(true)

      // Verify flow was deleted
      await expect(caller.flow.get(flow.id!)).rejects.toThrow()
    })

    it('should return success false for non-existent flow', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      const result = await caller.flow.delete('non-existent-id')
      expect(result.success).toBe(false)
    })
  })
})

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AppContext } from '../../../context'
import { describe, expect, it } from 'vitest'
import { appRouter } from '../../../router'
import { createTestContext } from '../../../test/utils/createTestContext'
import { createTestFlowMetadata } from '../../../test/utils/testHelpers'
import { createCallerFactory } from '../../../trpc'
import { FORK_ALLOW_RULE, FORK_DENY_RULE } from '../../../utils/fork-security'

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
      const flow = await caller.flow.get({
        flowId: result.id!,
      })
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

      await expect(caller.flow.get({
        flowId: 'non-existent-id',
      })).rejects.toThrow()
    })
  })

  describe('list', () => {
    it('should list all flows', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      // Create multiple flows
      await caller.flow.create({ name: 'Flow 1' })
      // small timeout to ensure the flows are created in different timestamps
      await new Promise(resolve => setTimeout(resolve, 20))
      await caller.flow.create({ name: 'Flow 2' })
      await new Promise(resolve => setTimeout(resolve, 20))
      await caller.flow.create({ name: 'Flow 3' })

      const flows = await caller.flow.list()
      expect(flows).toHaveLength(3)
      expect(flows.map(f => f.name)).toEqual(['Flow 3', 'Flow 2', 'Flow 1'])
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
      const result = await caller.flow.delete({
        flowId: flow.id!,
      })
      expect(result.success).toBe(true)

      // Verify flow was deleted
      await expect(caller.flow.get({
        flowId: flow.id!,
      })).rejects.toThrow()
    })

    it('should return error for non existent flow', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      const result = caller.flow.delete({
        flowId: 'non-existent-id',
      })
      await expect(result).rejects.toThrow('Flow with ID non-existent-id not found')
    })
  })

  describe('fork permission system', () => {
    // Helper to create a second user context that shares the same flow store
    function createSecondUserContext(sharedFlowStore: any): AppContext {
      const ctx = createTestContext(undefined, undefined, sharedFlowStore)
      return {
        ...ctx,
        session: {
          ...ctx.session,
          user: {
            id: 'dev:user2',
            displayName: 'User 2',
            role: 'user',
          },
          session: {
            ...ctx.session!.session,
            userId: 'dev:user2',
            token: 'user2-token',
            provider: 'dev' as const,
            user: ctx.session!.session.user!,
          },
        },
      }
    }

    describe('default fork rules', () => {
      it('should create flows with default fork rule (not forkable)', async () => {
        const ctx = createTestContext()
        const caller = createCaller(ctx)

        const flow = await caller.flow.create({ name: 'Test Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        const fullFlow = await caller.flow.get({ flowId: flow.id! })
        expect(fullFlow.metadata.forkRule).toEqual(FORK_DENY_RULE)
      })

      it('should prevent forking by default', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        // Create flow as owner
        const flow = await ownerCaller.flow.create({ name: 'Owner Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Try to fork as different user
        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        await expect(
          userCaller.flow.fork({ flowId: flow.id! }),
        ).rejects.toThrow('You do not have permission to fork this flow')
      })

      it('should show canFork: false in getMeta by default for non-owners', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Test Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Make flow public so non-owner can access it
        await ownerCaller.flow.setPublic({ flowId: flow.id!, isPublic: true })

        // Check as different user
        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        const meta = await userCaller.flow.getMeta({ flowId: flow.id! })
        expect(meta.canFork).toBe(false)
      })

      it('should always allow owners to fork their own flows', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Owner Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Owner should be able to fork even with default restrictive rule
        const forkedFlow = await ownerCaller.flow.fork({
          flowId: flow.id!,
          name: 'Owner Self Fork',
        })

        expect(forkedFlow.name).toBe('Owner Self Fork')
        expect(forkedFlow.parentId).toBe(flow.id)
        expect(forkedFlow.ownerID).toBe('dev:admin')
      })

      it('should create forked flow with unique ID different from original', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const originalFlow = await ownerCaller.flow.create({ name: 'Original Flow' })
        if (!originalFlow)
          throw new Error('Flow creation failed')

        // Fork the flow
        const forkedFlow = await ownerCaller.flow.fork({
          flowId: originalFlow.id!,
          name: 'Forked Flow',
        })

        // CRITICAL: Ensure forked flow has different ID than original
        expect(forkedFlow.id).toBeDefined()
        expect(forkedFlow.id).not.toBe(originalFlow.id)
        expect(typeof forkedFlow.id).toBe('string')
        expect(forkedFlow.id!.length).toBeGreaterThan(0)

        // Verify parent relationship is correct
        expect(forkedFlow.parentId).toBe(originalFlow.id)

        // Verify we can retrieve both flows independently
        const retrievedOriginal = await ownerCaller.flow.get({ flowId: originalFlow.id! })
        const retrievedForked = await ownerCaller.flow.get({ flowId: forkedFlow.id! })

        expect(retrievedOriginal.id).toBe(originalFlow.id)
        expect(retrievedForked.id).toBe(forkedFlow.id)
        expect(retrievedOriginal.id).not.toBe(retrievedForked.id)
      })

      it('should show canFork: true for owners even with default restrictive rule', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Owner Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Owner should see canFork: true even with default rule
        const meta = await ownerCaller.flow.getMeta({ flowId: flow.id! })
        expect(meta.canFork).toBe(true)
      })
    })

    describe('setForkRule', () => {
      it('should allow owner to set fork rules', async () => {
        const ctx = createTestContext()
        const caller = createCaller(ctx)

        const flow = await caller.flow.create({ name: 'Test Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        const result = await caller.flow.setForkRule({
          flowId: flow.id!,
          forkRule: FORK_ALLOW_RULE, // Allow everyone to fork
        })

        expect(result.success).toBe(true)
        expect(result.forkRule).toEqual(FORK_ALLOW_RULE)
      })

      it('should prevent non-owners from setting fork rules', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Owner Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Try to set rule as different user
        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        await expect(
          userCaller.flow.setForkRule({
            flowId: flow.id!,
            forkRule: FORK_ALLOW_RULE,
          }),
        ).rejects.toThrow('Only the flow owner can set fork rules')
      })

      it('should default to false rule when forkRule is undefined', async () => {
        const ctx = createTestContext()
        const caller = createCaller(ctx)

        const flow = await caller.flow.create({ name: 'Test Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        const result = await caller.flow.setForkRule({
          flowId: flow.id!,
          forkRule: undefined,
        })

        expect(result.forkRule).toEqual(FORK_DENY_RULE)
      })
    })

    describe('fork procedure with permissions', () => {
      it('should allow forking when rule evaluates to true', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        // Create flow and set permissive rule
        const flow = await ownerCaller.flow.create({ name: 'Forkable Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        await ownerCaller.flow.setForkRule({
          flowId: flow.id!,
          forkRule: FORK_ALLOW_RULE, // Allow everyone
        })

        // Fork as different user
        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        const forkedFlow = await userCaller.flow.fork({
          flowId: flow.id!,
          name: 'My Fork',
        })

        expect(forkedFlow.name).toBe('My Fork')
        expect(forkedFlow.parentId).toBe(flow.id)
        expect(forkedFlow.ownerID).toBe('dev:user2')
      })

      it('should allow owner to fork their own flow with isOwner rule', async () => {
        const ctx = createTestContext()
        const caller = createCaller(ctx)

        const flow = await caller.flow.create({ name: 'Owner Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Set rule to allow only owner
        await caller.flow.setForkRule({
          flowId: flow.id!,
          forkRule: { var: 'isOwner' },
        })

        // Owner should be able to fork
        const forkedFlow = await caller.flow.fork({
          flowId: flow.id!,
          name: 'Owner Fork',
        })

        expect(forkedFlow.name).toBe('Owner Fork')
        expect(forkedFlow.ownerID).toBe('dev:admin')
      })

      it('should prevent forking when rule evaluates to false', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Restricted Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Set restrictive rule - only specific user
        await ownerCaller.flow.setForkRule({
          flowId: flow.id!,
          forkRule: { '==': [{ var: 'userId' }, 'allowed-user'] },
        })

        // Try to fork as different user
        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        await expect(
          userCaller.flow.fork({ flowId: flow.id! }),
        ).rejects.toThrow('You do not have permission to fork this flow')
      })

      it('should reset fork rule to default in forked flow', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        // Create flow with permissive rule
        const flow = await ownerCaller.flow.create({ name: 'Original' })
        if (!flow)
          throw new Error('Flow creation failed')

        await ownerCaller.flow.setForkRule({
          flowId: flow.id!,
          forkRule: FORK_ALLOW_RULE,
        })

        // Fork the flow
        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        const forkedFlow = await userCaller.flow.fork({ flowId: flow.id! })

        // Get forked flow to check its rule
        const fullForkedFlow = await userCaller.flow.get({ flowId: forkedFlow.id! })
        expect(fullForkedFlow.metadata.forkRule).toEqual(FORK_DENY_RULE)
      })
    })

    describe('getMeta with forkability', () => {
      it('should show canFork: true when user can fork', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Public Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Make flow public and set permissive rule
        await ownerCaller.flow.setPublic({ flowId: flow.id!, isPublic: true })
        await ownerCaller.flow.setForkRule({
          flowId: flow.id!,
          forkRule: FORK_ALLOW_RULE,
        })

        // Check as different user
        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        const meta = await userCaller.flow.getMeta({ flowId: flow.id! })
        expect(meta.canFork).toBe(true)
      })

      it('should show canFork: false when user cannot fork', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Restricted Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Make flow public but keep default restrictive rule
        await ownerCaller.flow.setPublic({ flowId: flow.id!, isPublic: true })

        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        const meta = await userCaller.flow.getMeta({ flowId: flow.id! })
        expect(meta.canFork).toBe(false)
      })

      it('should show canFork: false for unauthenticated users', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Public Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Make flow public and set permissive rule
        await ownerCaller.flow.setPublic({ flowId: flow.id!, isPublic: true })
        await ownerCaller.flow.setForkRule({
          flowId: flow.id!,
          forkRule: FORK_ALLOW_RULE,
        })

        // Create unauthenticated context that shares the same flow store
        const unauthCtx = createTestContext(undefined, undefined, ownerCtx.flowStore)
        // @ts-expect-error - intentionally setting to null for testing
        unauthCtx.session = null

        const unauthCaller = createCaller(unauthCtx)
        const meta = await unauthCaller.flow.getMeta({ flowId: flow.id! })
        expect(meta.canFork).toBe(false)
      })

      it('should evaluate complex JSONLogic rules correctly', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Complex Rule Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Make flow public and set complex rule: allow owner OR specific user
        await ownerCaller.flow.setPublic({ flowId: flow.id!, isPublic: true })
        await ownerCaller.flow.setForkRule({
          flowId: flow.id!,
          forkRule: {
            or: [
              { var: 'isOwner' },
              { '==': [{ var: 'userId' }, 'dev:user2'] },
            ],
          },
        })

        // Check as the specific allowed user
        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        const meta = await userCaller.flow.getMeta({ flowId: flow.id! })
        expect(meta.canFork).toBe(true)

        // Check as owner
        const ownerMeta = await ownerCaller.flow.getMeta({ flowId: flow.id! })
        expect(ownerMeta.canFork).toBe(true)
      })
    })

    describe('privacy and visibility controls', () => {
      it('should create flows as private by default', async () => {
        const ctx = createTestContext()
        const caller = createCaller(ctx)

        const flow = await caller.flow.create({ name: 'Private Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        const fullFlow = await caller.flow.get({ flowId: flow.id! })
        expect(fullFlow.metadata.isPublic).toBeUndefined() // undefined = private
      })

      it('should allow owners to set flow visibility', async () => {
        const ctx = createTestContext()
        const caller = createCaller(ctx)

        const flow = await caller.flow.create({ name: 'Test Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Make public
        const result = await caller.flow.setPublic({
          flowId: flow.id!,
          isPublic: true,
        })

        expect(result.success).toBe(true)
        expect(result.isPublic).toBe(true)
      })

      it('should prevent non-owners from setting flow visibility', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Owner Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Try to set visibility as different user
        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        await expect(
          userCaller.flow.setPublic({
            flowId: flow.id!,
            isPublic: true,
          }),
        ).rejects.toThrow('User does not have access to this flow or flow not found')
      })

      it('should deny access to private flows for non-owners', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Private Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Try to access as different user
        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        await expect(
          userCaller.flow.getMeta({ flowId: flow.id! }),
        ).rejects.toThrow('Access denied: Flow is private')
      })

      it('should allow access to public flows for non-owners', async () => {
        const ownerCtx = createTestContext()
        const ownerCaller = createCaller(ownerCtx)

        const flow = await ownerCaller.flow.create({ name: 'Public Flow' })
        if (!flow)
          throw new Error('Flow creation failed')

        // Make public
        await ownerCaller.flow.setPublic({ flowId: flow.id!, isPublic: true })

        // Access as different user should work
        const userCtx = createSecondUserContext(ownerCtx.flowStore)
        const userCaller = createCaller(userCtx)

        const meta = await userCaller.flow.getMeta({ flowId: flow.id! })
        expect(meta.name).toBe('Public Flow')
        expect(meta.canFork).toBe(false) // Default fork rule is deny
      })
    })
  })
})

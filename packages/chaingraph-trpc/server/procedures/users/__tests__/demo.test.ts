/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryUserStore } from '../../../stores/userStore'
import { createCallerFactory, router } from '../../../trpc'
import { demoProcedures } from '../demo'

describe('demo Procedures - Input Validation', () => {
  let userStore: InMemoryUserStore
  let caller: ReturnType<typeof createCaller>

  const testRouter = router({
    users: router({
      demo: demoProcedures,
    }),
  })

  const createCaller = createCallerFactory(testRouter)

  beforeEach(() => {
    userStore = new InMemoryUserStore()
    caller = createCaller({
      session: { isAuthenticated: false },
      userStore,
    } as any)
  })

  describe('createDemoSession - Valid Inputs', () => {
    it('should accept valid displayName with letters and spaces', async () => {
      const result = await caller.users.demo.createDemoSession({
        displayName: 'John Doe',
      })

      expect(result.user.displayName).toBe('John Doe')
      expect(result.token).toBeDefined()
    })

    it('should accept displayName with hyphens', async () => {
      const result = await caller.users.demo.createDemoSession({
        displayName: 'Jean-Pierre',
      })

      expect(result.user.displayName).toBe('Jean-Pierre')
    })

    it('should accept displayName with underscores', async () => {
      const result = await caller.users.demo.createDemoSession({
        displayName: 'user_name_123',
      })

      expect(result.user.displayName).toBe('user_name_123')
    })

    it('should accept displayName with apostrophes', async () => {
      const result = await caller.users.demo.createDemoSession({
        displayName: 'O\'Brien',
      })

      expect(result.user.displayName).toBe('O\'Brien')
    })

    it('should accept displayName with periods', async () => {
      const result = await caller.users.demo.createDemoSession({
        displayName: 'Dr. Smith',
      })

      expect(result.user.displayName).toBe('Dr. Smith')
    })

    it('should accept displayName with numbers', async () => {
      const result = await caller.users.demo.createDemoSession({
        displayName: 'User123',
      })

      expect(result.user.displayName).toBe('User123')
    })

    it('should accept displayName at max length (50 chars)', async () => {
      const maxLengthName = 'A'.repeat(50)

      const result = await caller.users.demo.createDemoSession({
        displayName: maxLengthName,
      })

      expect(result.user.displayName).toBe(maxLengthName)
    })

    it('should accept undefined displayName', async () => {
      const result = await caller.users.demo.createDemoSession()

      expect(result.user.displayName).toMatch(/^Demo User /)
      expect(result.token).toBeDefined()
    })

    it('should accept empty input object', async () => {
      const result = await caller.users.demo.createDemoSession({})

      expect(result.user.displayName).toMatch(/^Demo User /)
    })
  })

  describe('createDemoSession - Invalid Inputs', () => {
    it('should reject empty string displayName', async () => {
      await expect(
        caller.users.demo.createDemoSession({
          displayName: '',
        }),
      ).rejects.toThrow('Display name must not be empty')
    })

    it('should reject displayName over 50 characters', async () => {
      const tooLongName = 'A'.repeat(51)

      await expect(
        caller.users.demo.createDemoSession({
          displayName: tooLongName,
        }),
      ).rejects.toThrow('Display name must be 50 characters or less')
    })

    it('should reject displayName with HTML tags (XSS attempt)', async () => {
      await expect(
        caller.users.demo.createDemoSession({
          displayName: '<script>alert("XSS")</script>',
        }),
      ).rejects.toThrow('Display name can only contain')
    })

    it('should reject displayName with angle brackets', async () => {
      await expect(
        caller.users.demo.createDemoSession({
          displayName: '<User>',
        }),
      ).rejects.toThrow('Display name can only contain')
    })

    it('should reject displayName with special characters (@, #, $)', async () => {
      await expect(
        caller.users.demo.createDemoSession({
          displayName: 'user@domain.com',
        }),
      ).rejects.toThrow('Display name can only contain')
    })

    it('should reject displayName with emoji', async () => {
      await expect(
        caller.users.demo.createDemoSession({
          displayName: 'User 😀',
        }),
      ).rejects.toThrow('Display name can only contain')
    })

    it('should reject displayName with newlines', async () => {
      await expect(
        caller.users.demo.createDemoSession({
          displayName: 'User\nName',
        }),
      ).rejects.toThrow('Display name can only contain')
    })

    it('should reject displayName with SQL injection attempt', async () => {
      await expect(
        caller.users.demo.createDemoSession({
          displayName: '\'; DROP TABLE users; --',
        }),
      ).rejects.toThrow('Display name can only contain')
    })

    it('should reject displayName with backslashes', async () => {
      await expect(
        caller.users.demo.createDemoSession({
          displayName: 'User\\Name',
        }),
      ).rejects.toThrow('Display name can only contain')
    })
  })
})

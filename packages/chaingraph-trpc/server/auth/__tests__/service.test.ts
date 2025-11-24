/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { GraphQL } from '@badaitech/badai-api'
import { GraphQLClient } from 'graphql-request'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryUserStore } from '../../stores/userStore'
import { mockBadAIResponses } from './fixtures/badai-responses'

// Mock the auth config module
const mockAuthConfig = {
  enabled: true,
  devMode: false,
  badaiAuth: {
    enabled: true,
    apiUrl: 'http://test-api.com/graphql',
  },
}

vi.mock('../config', () => ({
  authConfig: mockAuthConfig,
}))

describe('authService', () => {
  let userStore: InMemoryUserStore
  let AuthService: typeof import('../service').AuthService
  let authService: import('../service').AuthService
  const mockRequest = vi.fn()

  beforeEach(async () => {
    userStore = new InMemoryUserStore()
    vi.clearAllMocks()
    vi.spyOn(GraphQLClient.prototype, 'request').mockImplementation(mockRequest)

    // Reset mock config to defaults
    mockAuthConfig.enabled = true
    mockAuthConfig.devMode = false
    mockAuthConfig.badaiAuth.enabled = true

    // Re-import AuthService to get fresh instance with current config
    const module = await import('../service')
    AuthService = module.AuthService
    authService = new AuthService(userStore)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // =====================================================
  // P0: Core Functionality Tests
  // =====================================================
  describe('validateSession - Dev Mode (P0)', () => {
    beforeEach(async () => {
      mockAuthConfig.enabled = false
      mockAuthConfig.devMode = true
      const module = await import('../service')
      authService = new module.AuthService(userStore)
    })

    it('should return dev user session when auth is disabled', async () => {
      const session = await authService.validateSession(undefined)

      expect(session).not.toBeNull()
      expect(session?.provider).toBe('dev')
      expect(session?.user.role).toBe('admin')
      expect(session?.user.displayName).toBe('Admin User')
    })

    it('should auto-create dev user in database on first call', async () => {
      const session = await authService.validateSession(undefined)

      // Verify dev user exists in database
      const devUser = await userStore.getUserById(session!.userId)
      expect(devUser).not.toBeNull()

      // Verify external account created
      const accounts = await userStore.getExternalAccounts(session!.userId)
      expect(accounts).toHaveLength(1)
      expect(accounts[0].provider).toBe('dev')
      expect(accounts[0].externalId).toBe('admin')
    })

    it('should return same dev user on multiple calls (idempotent)', async () => {
      const session1 = await authService.validateSession(undefined)
      const session2 = await authService.validateSession('any-token')

      expect(session1?.userId).toBe(session2?.userId)
    })
  })

  describe('validateSession - No Token (P0)', () => {
    beforeEach(async () => {
      mockAuthConfig.enabled = true
      mockAuthConfig.devMode = false
      const module = await import('../service')
      authService = new module.AuthService(userStore)
    })

    it('should return null when token is undefined', async () => {
      const session = await authService.validateSession(undefined)
      expect(session).toBeNull()
    })

    it('should return null when token is empty string', async () => {
      const session = await authService.validateSession('')
      expect(session).toBeNull()
    })
  })

  describe('validateSession - Demo Token (P0)', () => {
    beforeEach(async () => {
      mockAuthConfig.enabled = true
      mockAuthConfig.devMode = false
      const module = await import('../service')
      authService = new module.AuthService(userStore)
    })

    it('should validate fresh demo token and return session', async () => {
      const { user, token } = await userStore.createDemoUser('Test Demo')

      const session = await authService.validateSession(token)

      expect(session).not.toBeNull()
      expect(session?.provider).toBe('demo')
      expect(session?.userId).toBe(user.id)
      expect(session?.user.displayName).toBe('Test Demo')
      expect(session?.user.role).toBe('user')
    })

    it('should return null for invalid demo token', async () => {
      const session = await authService.validateSession('demo_invalid_token')
      expect(session).toBeNull()
    })

    it('should return null for malformed demo token', async () => {
      const session = await authService.validateSession('demo_malformed')
      expect(session).toBeNull()
    })

    it('should return null for non-demo token that starts with demo', async () => {
      const session = await authService.validateSession('demo-but-not-jwt')
      expect(session).toBeNull()
    })
  })

  describe('validateSession - Archai Token (P0)', () => {
    beforeEach(async () => {
      mockAuthConfig.enabled = true
      mockAuthConfig.devMode = false
      mockAuthConfig.badaiAuth.enabled = true
      const module = await import('../service')
      authService = new module.AuthService(userStore)
    })

    it('should validate archai token and auto-create user', async () => {
      mockRequest.mockResolvedValueOnce(mockBadAIResponses.validUser)

      const session = await authService.validateSession('archai-token-123')

      expect(session).not.toBeNull()
      expect(session?.provider).toBe('archai')
      expect(session?.user.displayName).toBe('Test User')
      expect(session?.user.role).toBe('user')

      // Verify user created in database
      const user = await userStore.getUserById(session!.userId)
      expect(user).not.toBeNull()
      expect(user!.email).toBe('user@archai.com')
    })

    it('should return existing user on subsequent logins', async () => {
      mockRequest.mockResolvedValue(mockBadAIResponses.validUser)

      const session1 = await authService.validateSession('archai-token')
      const session2 = await authService.validateSession('archai-token')

      expect(session1?.userId).toBe(session2?.userId)

      // Verify only one user created
      const accounts = await userStore.getExternalAccounts(session1!.userId)
      expect(accounts).toHaveLength(1)
    })

    it('should return null when BadAI API fails', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Network error'))

      const session = await authService.validateSession('archai-token')

      expect(session).toBeNull()
    })

    it('should return null when BadAI returns null profile', async () => {
      mockRequest.mockResolvedValueOnce(mockBadAIResponses.nullProfile)

      const session = await authService.validateSession('invalid-archai-token')

      expect(session).toBeNull()
    })
  })

  describe('getUserFromSession (P0)', () => {
    beforeEach(async () => {
      mockAuthConfig.enabled = true
      mockAuthConfig.devMode = false
      const module = await import('../service')
      authService = new module.AuthService(userStore)
    })

    it('should return user from valid session', async () => {
      const { user, token } = await userStore.createDemoUser('Test')
      const session = await authService.validateSession(token)

      const retrievedUser = await authService.getUserFromSession(session)

      expect(retrievedUser).not.toBeNull()
      expect(retrievedUser?.id).toBe(user.id)
    })

    it('should return null for null session', async () => {
      const user = await authService.getUserFromSession(null)
      expect(user).toBeNull()
    })
  })

  // =====================================================
  // P1: Integration & Important Scenarios
  // =====================================================
  describe('validateSession - Integration Tests (P1)', () => {
    beforeEach(async () => {
      mockAuthConfig.enabled = true
      mockAuthConfig.devMode = false
      mockAuthConfig.badaiAuth.enabled = true
      const module = await import('../service')
      authService = new module.AuthService(userStore)
    })

    it('should update lastLoginAt on each dev login', async () => {
      mockAuthConfig.devMode = true
      const module = await import('../service')
      authService = new module.AuthService(userStore)

      const session1 = await authService.validateSession(undefined)
      const user1 = await userStore.getUserById(session1!.userId)
      const firstLogin = user1!.lastLoginAt

      await new Promise(resolve => setTimeout(resolve, 10))

      await authService.validateSession(undefined)
      const user2 = await userStore.getUserById(session1!.userId)

      expect(user2!.lastLoginAt!.getTime()).toBeGreaterThan(firstLogin!.getTime())
    })

    it('should map Admin role correctly', async () => {
      mockRequest.mockResolvedValueOnce(mockBadAIResponses.adminUser)

      const session = await authService.validateSession('admin-token')

      expect(session?.user.role).toBe('admin')

      const user = await userStore.getUserById(session!.userId)
      expect(user?.role).toBe('admin')
    })

    it('should map Agent role correctly', async () => {
      mockRequest.mockResolvedValueOnce(mockBadAIResponses.agentUser)

      const session = await authService.validateSession('agent-token')

      expect(session?.user.role).toBe('agent')
    })

    it('should map User role correctly', async () => {
      mockRequest.mockResolvedValueOnce(mockBadAIResponses.validUser)

      const session = await authService.validateSession('user-token')

      expect(session?.user.role).toBe('user')
    })

    it('should update external account metadata on re-authentication', async () => {
      // First login
      mockRequest.mockResolvedValueOnce({
        userProfile: {
          id: 'archai-123',
          email: 'old@example.com',
          name: 'Old Name',
          picture: 'old.jpg',
          role: GraphQL.UserRole.User,
          tariffCurrent: GraphQL.UserTariff.Free,
          tariffExpires: null,
          externalAccounts: [],
        },
      })

      const session1 = await authService.validateSession('token')

      // Second login with updated info
      mockRequest.mockResolvedValueOnce({
        userProfile: {
          id: 'archai-123',
          email: 'new@example.com',
          name: 'New Name',
          picture: 'new.jpg',
          role: GraphQL.UserRole.Admin,
          tariffCurrent: GraphQL.UserTariff.Unlimited,
          tariffExpires: null,
          externalAccounts: [],
        },
      })

      const session2 = await authService.validateSession('token')

      expect(session1?.userId).toBe(session2?.userId)

      // Verify external account updated
      const accounts = await userStore.getExternalAccounts(session2!.userId)
      expect(accounts[0].externalEmail).toBe('new@example.com')
      expect(accounts[0].displayName).toBe('New Name')
      expect(accounts[0].avatarUrl).toBe('new.jpg')
    })

    it('should update lastLoginAt when validating demo token', async () => {
      const { user, token } = await userStore.createDemoUser()
      const firstLogin = user.lastLoginAt

      await new Promise(resolve => setTimeout(resolve, 10))

      await authService.validateSession(token)
      const updatedUser = await userStore.getUserById(user.id)

      expect(updatedUser!.lastLoginAt!.getTime()).toBeGreaterThan(firstLogin!.getTime())
    })

    it('should support full demo user lifecycle (create → validate → upgrade)', async () => {
      // 1. Create demo user
      const { user, token } = await userStore.createDemoUser('Integration Test')

      // 2. Validate demo token
      const demoSession = await authService.validateSession(token)
      expect(demoSession?.userId).toBe(user.id)
      expect(await userStore.isUserDemo(user.id)).toBe(true)

      // 3. Link archai account (upgrade)
      await userStore.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: 'archai-upgraded',
        externalEmail: 'upgraded@example.com',
      })

      // 4. Verify no longer demo
      expect(await userStore.isUserDemo(user.id)).toBe(false)

      // 5. Demo token should still work
      const sessionAfterUpgrade = await authService.validateSession(token)
      expect(sessionAfterUpgrade?.userId).toBe(user.id)
    })

    it('should handle sequential logins for same archai user', async () => {
      mockRequest.mockResolvedValue(mockBadAIResponses.validUser)

      // Sequential logins (more realistic than perfect concurrency)
      const session1 = await authService.validateSession('token1')
      const session2 = await authService.validateSession('token2')
      const session3 = await authService.validateSession('token3')

      // All should return the same user
      expect(session1?.userId).toBe(session2?.userId)
      expect(session2?.userId).toBe(session3?.userId)

      // Only one user should be created
      const accounts = await userStore.getExternalAccounts(session1!.userId)
      expect(accounts).toHaveLength(1)
    })
  })

  // =====================================================
  // P2: Edge Cases
  // =====================================================
  describe('validateSession - Edge Cases (P2)', () => {
    beforeEach(async () => {
      mockAuthConfig.enabled = true
      mockAuthConfig.devMode = false
      mockAuthConfig.badaiAuth.enabled = true
      const module = await import('../service')
      authService = new module.AuthService(userStore)
    })

    it('should return null when BadAI auth is disabled', async () => {
      mockAuthConfig.badaiAuth.enabled = false
      const module = await import('../service')
      authService = new module.AuthService(userStore)

      const session = await authService.validateSession('archai-token')

      expect(mockRequest).not.toHaveBeenCalled()
      expect(session).toBeNull()
    })

    it('should handle BadAI API timeout gracefully', async () => {
      mockRequest.mockImplementationOnce(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100),
        ),
      )

      const session = await authService.validateSession('timeout-token')

      expect(session).toBeNull()
    })

    it('should map unknown BadAI role to guest', async () => {
      mockRequest.mockResolvedValueOnce({
        userProfile: {
          id: 'unknown-role-user',
          email: 'test@example.com',
          name: 'Unknown Role',
          picture: '',
          role: 'SuperAdmin' as any, // Unknown role
          tariffCurrent: 'Premium' as any,
          tariffExpires: null,
          externalAccounts: [],
        },
      })

      const session = await authService.validateSession('token')

      expect(session?.user.role).toBe('guest')
    })

    it('should handle extremely long token without crashing', async () => {
      const longToken = 'x'.repeat(10000)

      const session = await authService.validateSession(longToken)

      expect(session).toBeNull()
    })

    it('should handle token with special characters', async () => {
      const specialToken = 'token-with-!@#$%^&*()_+-=[]{}|;:,.<>?'

      mockRequest.mockRejectedValueOnce(new Error('Invalid token'))

      const session = await authService.validateSession(specialToken)

      expect(session).toBeNull()
    })

    it('should handle BadAI returning undefined userProfile', async () => {
      mockRequest.mockResolvedValueOnce({
        userProfile: undefined,
      })

      const session = await authService.validateSession('undefined-profile-token')

      expect(session).toBeNull()
    })

    it('should support multiple authentication providers for one user', async () => {
      // 1. Create via archai
      mockRequest.mockResolvedValueOnce(mockBadAIResponses.validUser)
      const archaiSession = await authService.validateSession('archai-token')

      // 2. Manually link demo account
      await userStore.linkExternalAccount(archaiSession!.userId, {
        provider: 'demo',
        externalId: 'demo-multi',
      })

      // 3. Verify both accounts exist
      const accounts = await userStore.getExternalAccounts(archaiSession!.userId)
      expect(accounts).toHaveLength(2)
      expect(accounts.map(a => a.provider)).toContain('archai')
      expect(accounts.map(a => a.provider)).toContain('demo')
    })
  })
})

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { isDemoToken } from '../../../auth/jwt'
import { InMemoryUserStore } from '../inMemoryUserStore'

describe('inMemoryUserStore', () => {
  let store: InMemoryUserStore

  beforeEach(() => {
    store = new InMemoryUserStore()
  })

  // =====================================================
  // Category 1: Basic CRUD Operations
  // =====================================================
  describe('basic CRUD Operations', () => {
    it('should create a user with all fields', async () => {
      const user = await store.createUser({
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'admin',
        metadata: { source: 'test' },
      })

      expect(user.id).toBeDefined()
      expect(user.id).toMatch(/^USR_/)
      expect(user.email).toBe('test@example.com')
      expect(user.displayName).toBe('Test User')
      expect(user.avatarUrl).toBe('https://example.com/avatar.jpg')
      expect(user.role).toBe('admin')
      expect(user.metadata).toEqual({ source: 'test' })
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
      expect(user.lastLoginAt).toBeInstanceOf(Date)
    })

    it('should create a user with minimal fields (defaults applied)', async () => {
      const user = await store.createUser({})

      expect(user.id).toMatch(/^USR_/)
      expect(user.email).toBeNull()
      expect(user.displayName).toBeNull()
      expect(user.avatarUrl).toBeNull()
      expect(user.role).toBe('user') // Default role
      expect(user.metadata).toBeNull()
      expect(user.createdAt).toBeInstanceOf(Date)
    })

    it('should get user by ID', async () => {
      const created = await store.createUser({
        displayName: 'Test User',
      })

      const retrieved = await store.getUserById(created.id)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.displayName).toBe('Test User')
    })

    it('should return null for non-existent user ID', async () => {
      const user = await store.getUserById('USR_nonexistent')

      expect(user).toBeNull()
    })

    it('should update user fields', async () => {
      const user = await store.createUser({
        displayName: 'Original Name',
        email: 'old@example.com',
      })

      const updated = await store.updateUser(user.id, {
        displayName: 'New Name',
        email: 'new@example.com',
        metadata: { updated: true },
      })

      expect(updated.displayName).toBe('New Name')
      expect(updated.email).toBe('new@example.com')
      expect(updated.metadata).toEqual({ updated: true })
    })

    it('should update updatedAt timestamp on update', async () => {
      const user = await store.createUser({ displayName: 'Test' })
      const originalUpdatedAt = user.updatedAt

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = await store.updateUser(user.id, {
        displayName: 'Updated',
      })

      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should throw error when updating non-existent user', async () => {
      await expect(
        store.updateUser('USR_nonexistent', { displayName: 'Test' }),
      ).rejects.toThrow('User USR_nonexistent not found')
    })

    it('should preserve fields not included in update', async () => {
      const user = await store.createUser({
        displayName: 'Test',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
      })

      const updated = await store.updateUser(user.id, {
        displayName: 'Updated Name',
      })

      expect(updated.displayName).toBe('Updated Name')
      expect(updated.email).toBe('test@example.com') // Preserved
      expect(updated.avatarUrl).toBe('https://example.com/avatar.jpg') // Preserved
    })
  })

  // =====================================================
  // Category 2: External Account Management
  // =====================================================
  describe('external Account Management', () => {
    it('should link external account to existing user', async () => {
      const user = await store.createUser({ displayName: 'Test User' })

      const account = await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '12345',
        externalEmail: 'test@archai.com',
        displayName: 'Archai User',
      })

      expect(account.id).toMatch(/^EXTACC_/)
      expect(account.userId).toBe(user.id)
      expect(account.provider).toBe('archai')
      expect(account.externalId).toBe('12345')
      expect(account.externalEmail).toBe('test@archai.com')
      expect(account.createdAt).toBeInstanceOf(Date)
      expect(account.lastUsedAt).toBeInstanceOf(Date)
    })

    it('should throw error when linking duplicate external account (same provider + externalId)', async () => {
      const user1 = await store.createUser({ displayName: 'User 1' })
      const user2 = await store.createUser({ displayName: 'User 2' })

      await store.linkExternalAccount(user1.id, {
        provider: 'archai',
        externalId: '12345',
      })

      await expect(
        store.linkExternalAccount(user2.id, {
          provider: 'archai',
          externalId: '12345',
        }),
      ).rejects.toThrow('External account archai:12345 is already linked')
    })

    it('should allow same externalId with different provider', async () => {
      const user = await store.createUser({ displayName: 'Test User' })

      await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '12345',
      })

      const account2 = await store.linkExternalAccount(user.id, {
        provider: 'telegram',
        externalId: '12345',
      })

      expect(account2.provider).toBe('telegram')
      expect(account2.externalId).toBe('12345')
    })

    it('should allow same provider with different externalId', async () => {
      const user = await store.createUser({ displayName: 'Test User' })

      await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '12345',
      })

      const account2 = await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '67890',
      })

      expect(account2.provider).toBe('archai')
      expect(account2.externalId).toBe('67890')
    })

    it('should get all external accounts for a user', async () => {
      const user = await store.createUser({ displayName: 'Test User' })

      await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '123',
      })
      await store.linkExternalAccount(user.id, {
        provider: 'telegram',
        externalId: '456',
      })

      const accounts = await store.getExternalAccounts(user.id)

      expect(accounts).toHaveLength(2)
      expect(accounts.map(a => a.provider)).toContain('archai')
      expect(accounts.map(a => a.provider)).toContain('telegram')
    })

    it('should return empty array for user with no external accounts', async () => {
      const user = await store.createUser({ displayName: 'Test User' })

      const accounts = await store.getExternalAccounts(user.id)

      expect(accounts).toEqual([])
    })

    it('should unlink external account', async () => {
      const user = await store.createUser({ displayName: 'Test User' })
      const account = await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '123',
      })

      await store.unlinkExternalAccount(account.id)

      const accounts = await store.getExternalAccounts(user.id)
      expect(accounts).toHaveLength(0)
    })

    it('should handle unlinking non-existent external account gracefully', async () => {
      await expect(
        store.unlinkExternalAccount('EXTACC_nonexistent'),
      ).resolves.not.toThrow()
    })
  })

  // =====================================================
  // Category 3: Auto-Migration Logic
  // =====================================================
  describe('auto-Migration Logic (getOrCreateUserByExternalAccount)', () => {
    it('should return existing user when external account exists', async () => {
      // Create user with external account
      const created = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
        displayName: 'Test User',
      })

      // Call again with same provider + externalId
      const retrieved = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
      })

      expect(retrieved.id).toBe(created.id)
    })

    it('should update lastUsedAt when finding existing external account', async () => {
      await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
      })

      const account1 = await store.getExternalAccounts((await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
      })).id)

      const firstLastUsed = account1[0].lastUsedAt

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10))

      await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
      })

      const account2 = await store.getExternalAccounts((await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
      })).id)

      expect(account2[0].lastUsedAt.getTime()).toBeGreaterThan(firstLastUsed.getTime())
    })

    it('should update user lastLoginAt when finding existing external account', async () => {
      const user1 = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
      })

      const firstLastLogin = user1.lastLoginAt!

      await new Promise(resolve => setTimeout(resolve, 10))

      const user2 = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
      })

      expect(user2.lastLoginAt!.getTime()).toBeGreaterThan(firstLastLogin.getTime())
    })

    it('should create new user when external account not found', async () => {
      const user = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: 'new123',
      })

      expect(user.id).toMatch(/^USR_/)
      expect(user).toBeDefined()
    })

    it('should link external account when creating new user', async () => {
      const user = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
        externalEmail: 'test@archai.com',
      })

      const accounts = await store.getExternalAccounts(user.id)

      expect(accounts).toHaveLength(1)
      expect(accounts[0].provider).toBe('archai')
      expect(accounts[0].externalId).toBe('123')
    })

    it('should use externalEmail as user email when creating', async () => {
      const user = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
        externalEmail: 'test@archai.com',
      })

      expect(user.email).toBe('test@archai.com')
    })

    it('should use displayName from external account when creating', async () => {
      const user = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
        displayName: 'Archai User',
      })

      expect(user.displayName).toBe('Archai User')
    })

    it('should default to "{provider} user" when no displayName provided', async () => {
      const user = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
      })

      expect(user.displayName).toBe('archai user')
    })

    it('should apply custom role when provided', async () => {
      const user = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
        role: 'admin',
      })

      expect(user.role).toBe('admin')
    })

    it('should default to "user" role when not provided', async () => {
      const user = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
      })

      expect(user.role).toBe('user')
    })
  })

  // =====================================================
  // Category 4: Demo User Functionality
  // =====================================================
  describe('demo User Functionality', () => {
    it('should create demo user with default display name', async () => {
      const { user, token } = await store.createDemoUser()

      expect(user.id).toMatch(/^USR_/)
      expect(user.displayName).toMatch(/^Demo User /)
      expect(user.role).toBe('user')
      expect(token).toBeDefined()
      expect(isDemoToken(token)).toBe(true)
    })

    it('should create demo user with custom display name', async () => {
      const { user, token } = await store.createDemoUser('My Custom Name')

      expect(user.displayName).toBe('My Custom Name')
      expect(isDemoToken(token)).toBe(true)
    })

    it('should generate unique demo tokens for different users', async () => {
      const { token: token1 } = await store.createDemoUser()
      const { token: token2 } = await store.createDemoUser()

      expect(token1).not.toBe(token2)
    })

    it('should create external account with provider="demo"', async () => {
      const { user } = await store.createDemoUser()

      const accounts = await store.getExternalAccounts(user.id)

      expect(accounts).toHaveLength(1)
      expect(accounts[0].provider).toBe('demo')
      expect(accounts[0].externalId).toBeDefined()
    })

    it('should validate valid demo token', async () => {
      const { user, token } = await store.createDemoUser('Test Demo')

      const validated = await store.validateDemoToken(token)

      expect(validated).not.toBeNull()
      expect(validated?.id).toBe(user.id)
      expect(validated?.displayName).toBe('Test Demo')
    })

    it('should return null for invalid demo token', async () => {
      const validated = await store.validateDemoToken('invalid_token')

      expect(validated).toBeNull()
    })

    it('should return null for malformed demo token', async () => {
      const validated = await store.validateDemoToken('demo_malformed_jwt')

      expect(validated).toBeNull()
    })

    it('should return null for non-demo token', async () => {
      const validated = await store.validateDemoToken('regular_token_123')

      expect(validated).toBeNull()
    })

    it('should update lastUsedAt on token validation', async () => {
      const { user, token } = await store.createDemoUser()

      const accounts1 = await store.getExternalAccounts(user.id)
      const firstLastUsed = accounts1[0].lastUsedAt

      await new Promise(resolve => setTimeout(resolve, 10))

      await store.validateDemoToken(token)

      const accounts2 = await store.getExternalAccounts(user.id)
      expect(accounts2[0].lastUsedAt.getTime()).toBeGreaterThan(firstLastUsed.getTime())
    })

    it('should identify user as demo when only one demo account exists', async () => {
      const { user } = await store.createDemoUser()

      const isDemo = await store.isUserDemo(user.id)

      expect(isDemo).toBe(true)
    })

    it('should NOT identify user as demo when multiple accounts exist', async () => {
      const { user } = await store.createDemoUser()

      // Link another account
      await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '123',
      })

      const isDemo = await store.isUserDemo(user.id)

      expect(isDemo).toBe(false)
    })

    it('should NOT identify user as demo when only one non-demo account exists', async () => {
      const user = await store.createUser({ displayName: 'Test' })
      await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '123',
      })

      const isDemo = await store.isUserDemo(user.id)

      expect(isDemo).toBe(false)
    })

    it('should get demo expiration date (createdAt + 7 days)', async () => {
      const { user } = await store.createDemoUser()

      const expiration = await store.getDemoExpiration(user.id)

      expect(expiration).not.toBeNull()

      const accounts = await store.getExternalAccounts(user.id)
      const expectedExpiration = new Date(accounts[0].createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)

      expect(expiration?.getTime()).toBe(expectedExpiration.getTime())
    })

    it('should return null expiration for non-demo user', async () => {
      const user = await store.createUser({ displayName: 'Test' })
      await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '123',
      })

      const expiration = await store.getDemoExpiration(user.id)

      expect(expiration).toBeNull()
    })

    it('should check if demo is not expired (fresh demo)', async () => {
      const { user } = await store.createDemoUser()

      const expired = await store.isDemoExpired(user.id)

      expect(expired).toBe(false)
    })

    it('should return false for isDemoExpired when user is not demo', async () => {
      const user = await store.createUser({ displayName: 'Test' })

      const expired = await store.isDemoExpired(user.id)

      expect(expired).toBe(false)
    })
  })

  // =====================================================
  // Category 5: Edge Cases & Error Scenarios
  // =====================================================
  describe('edge Cases & Error Scenarios', () => {
    it('should handle null/undefined fields correctly', async () => {
      const user = await store.createUser({
        email: undefined,
        displayName: undefined,
        avatarUrl: undefined,
      })

      expect(user.email).toBeNull()
      expect(user.displayName).toBeNull()
      expect(user.avatarUrl).toBeNull()
    })

    it('should preserve metadata as objects', async () => {
      const metadata = { complex: { nested: { data: 'value' } } }
      const user = await store.createUser({ metadata })

      expect(user.metadata).toEqual(metadata)
    })

    it('should handle empty string displayName', async () => {
      const user = await store.createUser({ displayName: '' })

      expect(user.displayName).toBe('')
    })

    it('should handle multiple external accounts per user', async () => {
      const user = await store.createUser({ displayName: 'Multi Auth User' })

      await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '123',
      })
      await store.linkExternalAccount(user.id, {
        provider: 'telegram',
        externalId: '456',
      })
      await store.linkExternalAccount(user.id, {
        provider: 'web3',
        externalId: '0xABC',
      })

      const accounts = await store.getExternalAccounts(user.id)

      expect(accounts).toHaveLength(3)
    })

    it('should handle user with no email', async () => {
      const user = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
        displayName: 'User Without Email',
      })

      expect(user.email).toBeNull()
    })

    it('should maintain separate users when linking different external accounts', async () => {
      const user1 = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
      })

      const user2 = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '456',
      })

      expect(user1.id).not.toBe(user2.id)
    })

    it('should generate unique user IDs', async () => {
      const user1 = await store.createUser({ displayName: 'User 1' })
      const user2 = await store.createUser({ displayName: 'User 2' })
      const user3 = await store.createUser({ displayName: 'User 3' })

      expect(user1.id).not.toBe(user2.id)
      expect(user1.id).not.toBe(user3.id)
      expect(user2.id).not.toBe(user3.id)
    })

    it('should generate unique external account IDs', async () => {
      const user = await store.createUser({ displayName: 'Test' })

      const acc1 = await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '123',
      })
      const acc2 = await store.linkExternalAccount(user.id, {
        provider: 'telegram',
        externalId: '456',
      })

      expect(acc1.id).not.toBe(acc2.id)
    })

    it('should handle external account with all optional fields empty', async () => {
      const user = await store.createUser({ displayName: 'Test' })

      const account = await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '123',
      })

      expect(account.externalEmail).toBeNull()
      expect(account.displayName).toBeNull()
      expect(account.avatarUrl).toBeNull()
      expect(account.metadata).toBeNull()
    })
  })

  // =====================================================
  // Category 6: Integration Scenarios
  // =====================================================
  describe('integration Scenarios', () => {
    it('should support demo user upgrading to real account (link archai)', async () => {
      // Create demo user
      const { user: demoUser } = await store.createDemoUser('Demo User')

      // Verify it's demo
      expect(await store.isUserDemo(demoUser.id)).toBe(true)

      // Link archai account (upgrade)
      await store.linkExternalAccount(demoUser.id, {
        provider: 'archai',
        externalId: '123',
        externalEmail: 'real@example.com',
      })

      // Verify no longer demo
      expect(await store.isUserDemo(demoUser.id)).toBe(false)

      // Verify has both accounts
      const accounts = await store.getExternalAccounts(demoUser.id)
      expect(accounts).toHaveLength(2)
      expect(accounts.map(a => a.provider)).toContain('demo')
      expect(accounts.map(a => a.provider)).toContain('archai')
    })

    it('should support user with Google + GitHub accounts', async () => {
      const user = await store.createUser({ displayName: 'Multi Provider User' })

      await store.linkExternalAccount(user.id, {
        provider: 'google',
        externalId: 'google-123',
        externalEmail: 'user@gmail.com',
      })

      await store.linkExternalAccount(user.id, {
        provider: 'github',
        externalId: 'github-456',
        externalEmail: 'user@github.com',
      })

      const accounts = await store.getExternalAccounts(user.id)
      expect(accounts).toHaveLength(2)
    })

    it('should handle external account re-authentication (update metadata)', async () => {
      const user1 = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
        displayName: 'Original Name',
        externalEmail: 'old@example.com',
      })

      // Re-authenticate with updated info
      const user2 = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
        displayName: 'Updated Name',
        externalEmail: 'new@example.com',
        avatarUrl: 'https://new-avatar.com/pic.jpg',
      })

      // Same user
      expect(user2.id).toBe(user1.id)

      // External account updated
      const accounts = await store.getExternalAccounts(user2.id)
      expect(accounts[0].displayName).toBe('Updated Name')
      expect(accounts[0].externalEmail).toBe('new@example.com')
      expect(accounts[0].avatarUrl).toBe('https://new-avatar.com/pic.jpg')
    })

    it('should handle user linking demo account after having archai', async () => {
      // Create user via archai
      const user = await store.getOrCreateUserByExternalAccount({
        provider: 'archai',
        externalId: '123',
      })

      // Link demo account (unusual but valid)
      await store.linkExternalAccount(user.id, {
        provider: 'demo',
        externalId: 'demo123',
      })

      // User should NOT be considered demo (has multiple accounts)
      expect(await store.isUserDemo(user.id)).toBe(false)

      // But should have demo account
      const accounts = await store.getExternalAccounts(user.id)
      expect(accounts.some(a => a.provider === 'demo')).toBe(true)
    })

    it('should support complete flow: create demo → link archai → check not demo', async () => {
      // Step 1: Create demo user
      const { user, token } = await store.createDemoUser('Demo Visitor')

      expect(user.displayName).toBe('Demo Visitor')
      expect(await store.isUserDemo(user.id)).toBe(true)

      const expiration = await store.getDemoExpiration(user.id)
      expect(expiration).not.toBeNull()

      // Step 2: Validate token works
      const validated = await store.validateDemoToken(token)
      expect(validated?.id).toBe(user.id)

      // Step 3: Link archai account (upgrade)
      await store.linkExternalAccount(user.id, {
        provider: 'archai',
        externalId: '123',
        externalEmail: 'real@example.com',
      })

      // Step 4: Verify upgraded
      expect(await store.isUserDemo(user.id)).toBe(false)

      const finalExpiration = await store.getDemoExpiration(user.id)
      expect(finalExpiration).not.toBeNull() // Still has demo account, but not "demo user"

      // Step 5: Verify has both accounts
      const accounts = await store.getExternalAccounts(user.id)
      expect(accounts).toHaveLength(2)
    })
  })
})

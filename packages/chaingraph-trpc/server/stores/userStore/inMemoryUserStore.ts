/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CreateUserData, DBUser, DemoSessionResult, ExternalAccount, ExternalAccountData, UpdateUserData, UserRole } from './types'
import type { UserStore } from './userStore'
import { customAlphabet } from 'nanoid'
import { alphanumeric } from 'nanoid-dictionary'
import { DEMO_EXPIRY_MS } from '../../auth/constants'
import { isDemoToken, signDemoToken, verifyDemoToken } from '../../auth/jwt'

// ID generators
const nanoid = customAlphabet(alphanumeric, 21)
const generateUserId = () => `USR${nanoid()}`
const generateExternalAccountId = () => `EXTACC${nanoid()}`

/**
 * In-memory implementation of UserStore for testing.
 * Matches PgUserStore behavior exactly but uses Map-based storage.
 *
 * Features:
 * - Auto-creates users on first login via getOrCreateUserByExternalAccount
 * - Supports multiple external accounts per user
 * - Stateless demo sessions with JWT (7 day expiry)
 * - Enforces unique constraint on (provider, externalId)
 */
export class InMemoryUserStore implements UserStore {
  private users: Map<string, DBUser> = new Map()
  private externalAccounts: Map<string, ExternalAccount> = new Map()
  private externalAccountIndex: Map<string, string> = new Map() // "provider:externalId" -> accountId
  private userExternalAccounts: Map<string, Set<string>> = new Map() // userId -> Set<accountId>

  async getUserById(id: string): Promise<DBUser | null> {
    return this.users.get(id) ?? null
  }

  async createUser(data: CreateUserData): Promise<DBUser> {
    const userId = generateUserId()
    const now = new Date()

    const user: DBUser = {
      id: userId,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      avatarUrl: data.avatarUrl ?? null,
      role: data.role ?? 'user',
      metadata: data.metadata ?? null,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    }

    this.users.set(userId, user)

    return user
  }

  async updateUser(id: string, data: UpdateUserData): Promise<DBUser> {
    const user = this.users.get(id)

    if (!user) {
      throw new Error(`User ${id} not found`)
    }

    const updatedUser: DBUser = {
      ...user,
      ...data,
      updatedAt: new Date(),
    }

    this.users.set(id, updatedUser)

    return updatedUser
  }

  /**
   * KEY METHOD for auto-migration.
   * Gets existing user by external account, or creates new user + links account.
   */
  async getOrCreateUserByExternalAccount(
    data: ExternalAccountData & { role?: string },
  ): Promise<DBUser> {
    // 1. Try to find existing external account
    const key = `${data.provider}:${data.externalId}`
    const existingAccId = this.externalAccountIndex.get(key)

    if (existingAccId) {
      const account = this.externalAccounts.get(existingAccId)!

      // Update external account metadata and last used
      const updatedAccount: ExternalAccount = {
        ...account,
        lastUsedAt: new Date(),
        displayName: data.displayName ?? account.displayName,
        avatarUrl: data.avatarUrl ?? account.avatarUrl,
        externalEmail: data.externalEmail ?? account.externalEmail,
      }
      this.externalAccounts.set(existingAccId, updatedAccount)

      // Update user's last login
      const user = this.users.get(account.userId)!
      const updatedUser: DBUser = {
        ...user,
        lastLoginAt: new Date(),
      }
      this.users.set(user.id, updatedUser)

      return updatedUser
    }

    // 2. Create new user + external account
    const user = await this.createUser({
      email: data.externalEmail,
      displayName: data.displayName ?? `${data.provider} user`,
      avatarUrl: data.avatarUrl,
      role: (data.role as UserRole) ?? 'user',
    })

    await this.linkExternalAccount(user.id, data)

    return user
  }

  async getExternalAccounts(userId: string): Promise<ExternalAccount[]> {
    const accountIds = this.userExternalAccounts.get(userId)

    if (!accountIds) {
      return []
    }

    return Array.from(accountIds)
      .map(id => this.externalAccounts.get(id))
      .filter((account): account is ExternalAccount => account !== undefined)
  }

  async linkExternalAccount(
    userId: string,
    data: ExternalAccountData,
  ): Promise<ExternalAccount> {
    // Check if this external account is already linked
    const key = `${data.provider}:${data.externalId}`
    if (this.externalAccountIndex.has(key)) {
      throw new Error(
        `External account ${data.provider}:${data.externalId} is already linked`,
      )
    }

    const accountId = generateExternalAccountId()
    const now = new Date()

    const account: ExternalAccount = {
      id: accountId,
      userId,
      provider: data.provider,
      externalId: data.externalId,
      externalEmail: data.externalEmail ?? null,
      displayName: data.displayName ?? null,
      avatarUrl: data.avatarUrl ?? null,
      metadata: data.metadata ?? null,
      createdAt: now,
      lastUsedAt: now,
    }

    // Store account
    this.externalAccounts.set(accountId, account)

    // Update index
    this.externalAccountIndex.set(key, accountId)

    // Update user's account set
    if (!this.userExternalAccounts.has(userId)) {
      this.userExternalAccounts.set(userId, new Set())
    }
    this.userExternalAccounts.get(userId)!.add(accountId)

    return account
  }

  async unlinkExternalAccount(externalAccountId: string): Promise<void> {
    const account = this.externalAccounts.get(externalAccountId)

    if (!account) {
      return // Silently succeed if account doesn't exist
    }

    // Remove from index
    const key = `${account.provider}:${account.externalId}`
    this.externalAccountIndex.delete(key)

    // Remove from user's account set
    const userAccounts = this.userExternalAccounts.get(account.userId)
    if (userAccounts) {
      userAccounts.delete(externalAccountId)
      if (userAccounts.size === 0) {
        this.userExternalAccounts.delete(account.userId)
      }
    }

    // Remove account
    this.externalAccounts.delete(externalAccountId)
  }

  /**
   * Create a demo user with stateless JWT token (7 day expiry).
   * Demo status is derived from having only one external account with provider='demo'.
   */
  async createDemoUser(displayName?: string): Promise<DemoSessionResult> {
    const demoId = nanoid()

    // Create user
    const user = await this.createUser({
      displayName: displayName ?? `Demo User ${demoId.slice(0, 6)}`,
      role: 'user',
    })

    // Link demo external account
    await this.linkExternalAccount(user.id, {
      provider: 'demo',
      externalId: demoId,
      displayName,
    })

    // Generate stateless JWT token
    const token = signDemoToken(demoId)

    return { user, token }
  }

  /**
   * Validate demo JWT token and return user.
   * Token validation is stateless - no database lookup for the token itself.
   */
  async validateDemoToken(token: string): Promise<DBUser | null> {
    // Quick check for demo token format
    if (!isDemoToken(token)) {
      return null
    }

    try {
      // Verify JWT signature and expiry
      const { demoId } = verifyDemoToken(token)

      // Look up demo user by external account
      const key = `demo:${demoId}`
      const accountId = this.externalAccountIndex.get(key)

      if (!accountId) {
        return null
      }

      const account = this.externalAccounts.get(accountId)!
      const user = this.users.get(account.userId)!

      // Check expiration: demo account createdAt + DEMO_EXPIRY_DAYS
      const expiresAt = new Date(account.createdAt.getTime() + DEMO_EXPIRY_MS)
      if (expiresAt < new Date()) {
        return null // Demo expired
      }

      // Update last used timestamp for the external account
      this.externalAccounts.set(accountId, {
        ...account,
        lastUsedAt: new Date(),
      })

      // Update user's last login
      this.users.set(user.id, {
        ...user,
        lastLoginAt: new Date(),
      })

      return user
    } catch (error) {
      // Token verification failed or user not found
      return null
    }
  }

  /**
   * Check if a user is a demo user.
   * A user is demo if they have ONLY ONE external account with provider='demo'.
   */
  async isUserDemo(userId: string): Promise<boolean> {
    const accounts = await this.getExternalAccounts(userId)
    return accounts.length === 1 && accounts[0].provider === 'demo'
  }

  /**
   * Get the expiration date for a demo user.
   * Returns null if user has no demo account.
   * Expiration = demo account createdAt + 7 days
   */
  async getDemoExpiration(userId: string): Promise<Date | null> {
    const accounts = await this.getExternalAccounts(userId)
    const demoAccount = accounts.find(a => a.provider === 'demo')

    if (!demoAccount) {
      return null
    }

    // Expiration is DEMO_EXPIRY_DAYS after demo account creation
    return new Date(demoAccount.createdAt.getTime() + DEMO_EXPIRY_MS)
  }

  /**
   * Check if a demo user has expired.
   * Returns false if user has no demo account.
   */
  async isDemoExpired(userId: string): Promise<boolean> {
    const expiration = await this.getDemoExpiration(userId)
    if (!expiration) {
      return false
    }
    return expiration < new Date()
  }
}

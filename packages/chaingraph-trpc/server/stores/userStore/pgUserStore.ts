/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBType } from '../../context'
import type { CreateUserData, DBUser, DemoSessionResult, ExternalAccount, ExternalAccountData, UpdateUserData, UserRole } from './types'
import type { UserStore } from './userStore'
import { and, eq } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import { alphanumeric } from 'nanoid-dictionary'
import { DEMO_EXPIRY_MS } from '../../auth/constants'
import { isDemoToken, signDemoToken, verifyDemoToken } from '../../auth/jwt'
import { externalAccountsTable, usersTable } from '../postgres/schema'

// ID generators
const nanoid = customAlphabet(alphanumeric, 21)
const generateUserId = () => `USR${nanoid()}`
const generateExternalAccountId = () => `EXTACC${nanoid()}`

/**
 * PostgreSQL implementation of UserStore.
 *
 * Features:
 * - Auto-creates users on first login via getOrCreateUserByExternalAccount
 * - Supports multiple external accounts per user
 * - Stateless demo sessions with JWT (7 day expiry)
 * - Transaction support for atomic operations
 */
export class PgUserStore implements UserStore {
  constructor(private db: DBType) { }

  async getUserById(id: string): Promise<DBUser | null> {
    const result = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1)

    return result[0] ? (result[0] as DBUser) : null
  }

  async createUser(data: CreateUserData): Promise<DBUser> {
    const userId = generateUserId()

    const [user] = await this.db
      .insert(usersTable)
      .values({
        id: userId,
        email: data.email ?? null,
        displayName: data.displayName ?? null,
        avatarUrl: data.avatarUrl ?? null,
        role: data.role ?? 'user',
        metadata: data.metadata ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      })
      .returning()

    return user as DBUser
  }

  async updateUser(id: string, data: UpdateUserData): Promise<DBUser> {
    const [user] = await this.db
      .update(usersTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, id))
      .returning()

    if (!user) {
      throw new Error(`User ${id} not found`)
    }

    return user as DBUser
  }

  /**
   * KEY METHOD for auto-migration.
   * Gets existing user by external account, or creates new user + links account.
   */
  async getOrCreateUserByExternalAccount(
    data: ExternalAccountData & { role?: string },
  ): Promise<DBUser> {
    // 1. Try to find existing external account
    const existingAccounts = await this.db
      .select()
      .from(externalAccountsTable)
      .where(
        and(
          eq(externalAccountsTable.provider, data.provider),
          eq(externalAccountsTable.externalId, data.externalId),
        ),
      )
      .limit(1)

    if (existingAccounts.length > 0) {
      const account = existingAccounts[0]

      // Update external account metadata and last used
      await this.db
        .update(externalAccountsTable)
        .set({
          lastUsedAt: new Date(),
          displayName: data.displayName ?? account.displayName,
          avatarUrl: data.avatarUrl ?? account.avatarUrl,
          externalEmail: data.externalEmail ?? account.externalEmail,
        })
        .where(eq(externalAccountsTable.id, account.id))

      // Update user's last login
      await this.db
        .update(usersTable)
        .set({
          lastLoginAt: new Date(),
        })
        .where(eq(usersTable.id, account.userId))

      // Return existing user
      const user = await this.getUserById(account.userId)
      if (!user) {
        throw new Error(`User ${account.userId} not found`)
      }
      return user
    }

    // 2. Create new user + external account in transaction
    return await this.db.transaction(async (tx) => {
      const userId = generateUserId()

      // Create user
      const [newUser] = await tx
        .insert(usersTable)
        .values({
          id: userId,
          email: data.externalEmail ?? null,
          displayName: data.displayName ?? `${data.provider} user`,
          avatarUrl: data.avatarUrl ?? null,
          role: (data.role as UserRole) ?? 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
        })
        .returning()

      // Link external account
      await tx.insert(externalAccountsTable).values({
        id: generateExternalAccountId(),
        userId,
        provider: data.provider,
        externalId: data.externalId,
        externalEmail: data.externalEmail ?? null,
        displayName: data.displayName ?? null,
        avatarUrl: data.avatarUrl ?? null,
        metadata: data.metadata ?? null,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      })

      return newUser as DBUser
    })
  }

  async getExternalAccounts(userId: string): Promise<ExternalAccount[]> {
    return await this.db
      .select()
      .from(externalAccountsTable)
      .where(eq(externalAccountsTable.userId, userId))
  }

  async linkExternalAccount(
    userId: string,
    data: ExternalAccountData,
  ): Promise<ExternalAccount> {
    // Check if this external account is already linked
    const existing = await this.db
      .select()
      .from(externalAccountsTable)
      .where(
        and(
          eq(externalAccountsTable.provider, data.provider),
          eq(externalAccountsTable.externalId, data.externalId),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      throw new Error(
        `External account ${data.provider}:${data.externalId} is already linked`,
      )
    }

    const [account] = await this.db
      .insert(externalAccountsTable)
      .values({
        id: generateExternalAccountId(),
        userId,
        provider: data.provider,
        externalId: data.externalId,
        externalEmail: data.externalEmail ?? null,
        displayName: data.displayName ?? null,
        avatarUrl: data.avatarUrl ?? null,
        metadata: data.metadata ?? null,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      })
      .returning()

    return account
  }

  async unlinkExternalAccount(externalAccountId: string): Promise<void> {
    await this.db
      .delete(externalAccountsTable)
      .where(eq(externalAccountsTable.id, externalAccountId))
  }

  /**
   * Create a demo user with stateless JWT token (7 day expiry).
   * Demo status is derived from having only one external account with provider='demo'.
   */
  async createDemoUser(displayName?: string): Promise<DemoSessionResult> {
    const demoId = nanoid()

    // Create user + external account in transaction
    const user = await this.db.transaction(async (tx) => {
      const userId = generateUserId()

      // Create user (no isDemo or demoExpiresAt fields)
      const [newUser] = await tx
        .insert(usersTable)
        .values({
          id: userId,
          displayName: displayName ?? `Demo User ${demoId.slice(0, 6)}`,
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
        })
        .returning()

      // Link demo external account
      await tx.insert(externalAccountsTable).values({
        id: generateExternalAccountId(),
        userId,
        provider: 'demo',
        externalId: demoId,
        displayName: displayName ?? null,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      })

      return newUser as DBUser
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
      const accounts = await this.db
        .select()
        .from(externalAccountsTable)
        .innerJoin(usersTable, eq(externalAccountsTable.userId, usersTable.id))
        .where(
          and(
            eq(externalAccountsTable.provider, 'demo'),
            eq(externalAccountsTable.externalId, demoId),
          ),
        )
        .limit(1)

      if (accounts.length === 0) {
        return null
      }

      const demoAccount = accounts[0].external_accounts
      const user = accounts[0].users

      // Check expiration: demo account createdAt + DEMO_EXPIRY_DAYS
      const expiresAt = new Date(demoAccount.createdAt.getTime() + DEMO_EXPIRY_MS)
      if (expiresAt < new Date()) {
        return null // Demo expired
      }

      // Update last used timestamp for the external account
      await this.db
        .update(externalAccountsTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(externalAccountsTable.id, demoAccount.id))

      // Update user's last login
      await this.db
        .update(usersTable)
        .set({ lastLoginAt: new Date() })
        .where(eq(usersTable.id, user.id))

      return user as DBUser
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

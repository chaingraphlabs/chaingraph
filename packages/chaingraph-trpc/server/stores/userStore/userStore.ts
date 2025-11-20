/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CreateUserData, DBUser, DemoSessionResult, ExternalAccount, ExternalAccountData, UpdateUserData } from './types'

/**
 * UserStore interface for managing ChainGraph users and their external accounts.
 *
 * This store provides:
 * - User CRUD operations
 * - External account linking (archai, demo, telegram, web3, etc.)
 * - Auto-migration: getOrCreateUserByExternalAccount creates users on first login
 * - Demo user creation with stateless JWT tokens
 */
export interface UserStore {
  /**
   * Get user by internal ChainGraph user ID
   */
  getUserById: (id: string) => Promise<DBUser | null>

  /**
   * Create a new user
   */
  createUser: (data: CreateUserData) => Promise<DBUser>

  /**
   * Update an existing user
   */
  updateUser: (id: string, data: UpdateUserData) => Promise<DBUser>

  /**
   * Get or create user by external account (provider + externalId).
   * This is the KEY method for auto-migration:
   * - If external account exists, returns existing user
   * - If not, creates new user + links external account
   *
   * Used during session validation to auto-create users on login.
   */
  getOrCreateUserByExternalAccount: (data: ExternalAccountData & { role?: string }) => Promise<DBUser>

  /**
   * Get all external accounts for a user
   */
  getExternalAccounts: (userId: string) => Promise<ExternalAccount[]>

  /**
   * Link a new external account to an existing user
   */
  linkExternalAccount: (userId: string, data: ExternalAccountData) => Promise<ExternalAccount>

  /**
   * Unlink an external account
   */
  unlinkExternalAccount: (externalAccountId: string) => Promise<void>

  /**
   * Create a demo user with a stateless JWT token (valid for 7 days).
   * No session storage needed - JWT is self-contained.
   */
  createDemoUser: (displayName?: string) => Promise<DemoSessionResult>

  /**
   * Validate a demo JWT token and return the user.
   * Returns null if token is invalid or expired.
   */
  validateDemoToken: (token: string) => Promise<DBUser | null>

  /**
   * Check if a user is a demo user.
   * A user is demo if they have ONLY ONE external account with provider='demo'.
   */
  isUserDemo: (userId: string) => Promise<boolean>

  /**
   * Get the expiration date for a demo user.
   * Returns null if user is not demo or has no demo account.
   * Expiration = demo account createdAt + 7 days
   */
  getDemoExpiration: (userId: string) => Promise<Date | null>

  /**
   * Check if a demo user has expired.
   * Returns false if user is not demo.
   */
  isDemoExpired: (userId: string) => Promise<boolean>
}

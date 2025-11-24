/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export type UserRole = 'admin' | 'user' | 'agent'

/**
 * Database user record (stored in chaingraph_users table).
 * This is different from the auth User type which is used for sessions.
 */
export interface DBUser {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
  metadata: Record<string, unknown> | null
}

export interface ExternalAccount {
  id: string
  userId: string
  provider: string
  externalId: string
  externalEmail: string | null
  displayName: string | null
  avatarUrl: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  lastUsedAt: Date
}

export interface CreateUserData {
  email?: string
  displayName?: string
  avatarUrl?: string
  role?: UserRole
  metadata?: Record<string, unknown>
}

export interface UpdateUserData {
  email?: string
  displayName?: string
  avatarUrl?: string
  role?: UserRole
  lastLoginAt?: Date
  metadata?: Record<string, unknown>
}

export interface ExternalAccountData {
  provider: string
  externalId: string
  externalEmail?: string
  displayName?: string
  avatarUrl?: string
  metadata?: Record<string, unknown>
}

export interface DemoSessionResult {
  user: DBUser
  token: string
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export type UserRole = 'admin' | 'user' | 'guest'

export interface User {
  id: string
  displayName?: string
  role: UserRole
  // Add other user properties as needed
}

export interface AuthSession {
  userId: string
  token: string
  provider: 'badai' | 'dev' | 'none'
  user: User
  expiresAt?: Date
}

export const DevUser: User = {
  id: 'dev:admin',
  displayName: 'Admin User',
  role: 'admin',
}

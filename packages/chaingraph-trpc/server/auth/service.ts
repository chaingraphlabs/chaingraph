/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { UserStore } from '../stores/userStore'
import type { AuthSession, User, UserRole } from './types'

import { GraphQL } from '@badaitech/badai-api'
import { GraphQLClient } from 'graphql-request'
import { authConfig } from './config'
import { isDemoToken } from './jwt'

export class AuthService {
  private badaiClient: GraphQLClient | null = null

  constructor(private userStore: UserStore) {
    // Initialize BadAI client if enabled
    if (authConfig.badaiAuth.enabled) {
      this.badaiClient = new GraphQLClient(authConfig.badaiAuth.apiUrl)
    }
  }

  /**
   * Validate a session token and return user information.
   * Auto-creates users in database on first login (lazy migration).
   */
  async validateSession(token: string | undefined): Promise<AuthSession | null> {
    // If auth is disabled globally, return the dev user session
    if (!authConfig.enabled || authConfig.devMode) {
      // Auto-create dev user in database
      const devUser = await this.userStore.getOrCreateUserByExternalAccount({
        provider: 'dev',
        externalId: 'admin',
        displayName: 'Admin User',
        role: 'admin',
      })

      return {
        userId: devUser.id,
        provider: 'dev',
        token: 'dev-token',
        user: {
          id: devUser.id,
          displayName: devUser.displayName ?? 'Admin User',
          role: devUser.role as UserRole,
          provider: 'dev',
        },
      }
    }

    // No token provided
    if (!token) {
      return null
    }

    // Check for demo token
    if (isDemoToken(token)) {
      const demoUser = await this.userStore.validateDemoToken(token)
      if (demoUser) {
        return {
          userId: demoUser.id,
          provider: 'demo',
          token,
          user: {
            id: demoUser.id,
            displayName: demoUser.displayName ?? undefined,
            role: demoUser.role as UserRole,
            provider: 'demo',
          },
        }
      }
      // Demo token invalid or expired
      return null
    }

    // Try BadAI authentication if enabled
    if (authConfig.badaiAuth.enabled && this.badaiClient) {
      try {
        const { userProfile } = await this.badaiClient.request(GraphQL.GetUserProfileDocument, {
          session: token,
        })

        if (userProfile && userProfile.id) {
          // Auto-create/update user in database
          const internalUser = await this.userStore.getOrCreateUserByExternalAccount({
            provider: 'archai',
            externalId: userProfile.id,
            externalEmail: userProfile.email,
            displayName: userProfile.name,
            avatarUrl: userProfile.picture,
            role: this.mapBadAIUserRole(userProfile.role),
          })

          return {
            userId: internalUser.id,
            provider: 'archai',
            token,
            user: {
              id: internalUser.id,
              displayName: internalUser.displayName ?? undefined,
              role: internalUser.role as UserRole,
              provider: 'archai',
            },
            // TODO: needs to parse JWT token and get expiration date "exp" field
            // expiresAt: userProfile.expiresAt ? new Date(userProfile.expiresAt) : undefined,
          }
        }
      } catch (error) {
        // console.error('BadAI token validation error:', error)
      }
    }

    // No valid session found
    return null
  }

  /**
   * Get user details from a validated session
   */
  async getUserFromSession(session: AuthSession | null): Promise<User | null> {
    if (!session) {
      return null
    }

    // All providers now return user from database
    return session.user
  }

  protected mapBadAIUserRole(role: GraphQL.UserRole): UserRole {
    switch (role) {
      case GraphQL.UserRole.Admin:
        return 'admin'
      case GraphQL.UserRole.Agent:
        return 'agent'
      case GraphQL.UserRole.User:
        return 'user'
      default:
        return 'guest'
    }
  }
}

/**
 * Create an AuthService instance.
 * Note: For the main tRPC server, authService is created in context initialization.
 * This export is for other packages (like executor) that need their own instance.
 */
export function createAuthService(userStore: UserStore): AuthService {
  return new AuthService(userStore)
}

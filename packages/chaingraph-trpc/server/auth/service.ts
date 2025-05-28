/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AuthSession, User, UserRole } from './types'

import { GraphQL } from '@badaitech/badai-api'
import { GraphQLClient } from 'graphql-request'
import { authConfig } from './config'
import { DevUser } from './types'

export class AuthService {
  private badaiClient: GraphQLClient | null = null

  constructor() {
    // Initialize BadAI client if enabled
    if (authConfig.badaiAuth.enabled) {
      this.badaiClient = new GraphQLClient(authConfig.badaiAuth.apiUrl)
    }
  }

  /**
   * Validate a session token and return user information
   */
  async validateSession(token: string | undefined): Promise<AuthSession | null> {
    // If auth is disabled globally, return the dev user session
    if (!authConfig.enabled || authConfig.devMode) {
      return {
        userId: `${DevUser.id}`,
        provider: 'dev',
        token: 'dev-token',
        user: DevUser,
      }
    }

    // No token provided
    if (!token) {
      return null
    }

    // Try BadAI authentication if enabled
    if (authConfig.badaiAuth.enabled && this.badaiClient) {
      try {
        const { userProfile } = await this.badaiClient.request(GraphQL.GetUserProfileDocument, {
          session: token,
        })

        if (userProfile && userProfile.id) {
          const user: User = {
            id: `badai:${userProfile.id}`,
            displayName: userProfile.name,
            role: this.mapBadAIUserRole(userProfile.role),
            provider: 'badai',
          }

          // TODO: add session token to the TTL cache. Check that key TTL time before session expiration

          return {
            userId: `badai:${userProfile.id}`,
            provider: 'badai',
            token,
            user,
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

    if (session.provider === 'dev') {
      return DevUser
    }

    if (session.provider === 'badai') {
      return session.user
    }

    return null
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

// Create a singleton instance
export const authService = new AuthService()

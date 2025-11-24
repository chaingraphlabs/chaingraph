/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { GraphQL } from '@badaitech/badai-api'

/**
 * Reusable mock responses for BadAI GraphQL API
 */
export const mockBadAIResponses = {
  validUser: {
    userProfile: {
      id: 'archai-123',
      email: 'user@archai.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      role: GraphQL.UserRole.User,
      tariffCurrent: GraphQL.UserTariff.Free,
      tariffExpires: null,
      externalAccounts: [],
    },
  },

  adminUser: {
    userProfile: {
      id: 'archai-admin',
      email: 'admin@archai.com',
      name: 'Admin User',
      picture: 'https://example.com/admin-avatar.jpg',
      role: GraphQL.UserRole.Admin,
      tariffCurrent: GraphQL.UserTariff.Unlimited,
      tariffExpires: null,
      externalAccounts: [],
    },
  },

  agentUser: {
    userProfile: {
      id: 'archai-agent',
      email: 'agent@archai.com',
      name: 'Agent User',
      picture: '',
      role: GraphQL.UserRole.Agent,
      tariffCurrent: GraphQL.UserTariff.Free,
      tariffExpires: null,
      externalAccounts: [],
    },
  },

  minimalUser: {
    userProfile: {
      id: 'archai-minimal',
      email: 'minimal@archai.com',
      name: 'Minimal User',
      picture: '',
      role: GraphQL.UserRole.User,
      tariffCurrent: GraphQL.UserTariff.Free,
      tariffExpires: null,
      externalAccounts: [],
    },
  },

  nullProfile: {
    userProfile: null,
  },
}

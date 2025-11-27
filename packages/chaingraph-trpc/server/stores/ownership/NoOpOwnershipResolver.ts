/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IOwnershipResolver } from './IOwnershipResolver'

/**
 * No-op ownership resolver that only checks direct ID matching
 *
 * Used when:
 * - External account lookups are not available
 * - Testing scenarios
 * - In-memory stores without user management
 *
 * This implementation does NOT support backward compatibility with old IDs.
 */
export class NoOpOwnershipResolver implements IOwnershipResolver {
  async isOwner(userId: string, ownerId: string): Promise<boolean> {
    return userId === ownerId // Direct match only
  }

  async getAllUserIds(userId: string): Promise<string[]> {
    return [userId] // Only internal ID, no external account lookup
  }
}

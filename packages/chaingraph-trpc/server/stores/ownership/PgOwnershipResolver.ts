/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { UserStore } from '../userStore'
import type { IOwnershipResolver } from './IOwnershipResolver'

/**
 * PostgreSQL-based ownership resolver using UserStore for external account lookups
 *
 * Provides backward compatibility for flows/executions created before user migration:
 * - New entities: owner_id = "USRxxx..." (internal ID)
 * - Old entities: owner_id = "archai-123" (ArchAI ID)
 *
 * This implementation queries the external_accounts table to resolve old IDs.
 */
export class PgOwnershipResolver implements IOwnershipResolver {
  constructor(private userStore: UserStore) { }

  async isOwner(userId: string, ownerId: string): Promise<boolean> {
    if (!userId || !ownerId)
      return false

    // Check 1: Direct match (new entities with internal USR... IDs)
    if (userId === ownerId)
      return true

    // Check 2: External account match (old entities with provider IDs)
    try {
      const externalAccounts = await this.userStore.getExternalAccounts(userId)
      return externalAccounts.some(acc => acc.externalId === ownerId)
    } catch (error) {
      // If external account lookup fails, return false
      return false
    }
  }

  async getAllUserIds(userId: string): Promise<string[]> {
    const ids: string[] = [userId] // Start with internal ID

    try {
      const externalAccounts = await this.userStore.getExternalAccounts(userId)
      const externalIds = externalAccounts.map(acc => `${acc.provider}:${acc.externalId}`)
      return [userId, ...externalIds]
    } catch (error) {
      // If lookup fails, return only internal ID
      return ids
    }
  }
}

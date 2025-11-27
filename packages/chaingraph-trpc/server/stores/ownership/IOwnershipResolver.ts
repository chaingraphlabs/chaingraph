/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Interface for resolving user ownership and identity mappings.
 *
 * This provides a minimal interface for checking ownership that supports:
 * - Direct ID matching (new flows with internal USR... IDs)
 * - External account matching (old flows with ArchAI/provider IDs)
 *
 * This abstraction allows FlowStore to check ownership without depending
 * on the full UserStore implementation, making it easier to test and maintain.
 */
export interface IOwnershipResolver {
  /**
   * Check if a user owns a resource based on owner ID
   *
   * Handles both:
   * - Direct match: userId === ownerId (new entities)
   * - External match: userId's external accounts include ownerId (old entities)
   *
   * @param userId User identifier (internal USR... format)
   * @param ownerId Resource owner identifier (may be internal or external ID)
   * @returns true if user owns the resource
   */
  isOwner: (userId: string, ownerId: string) => Promise<boolean>

  /**
   * Get all possible owner IDs for a user
   *
   * Returns an array containing:
   * - The user's internal ID (USR...)
   * - All linked external IDs (ArchAI ID, demo ID, etc.)
   *
   * Used for querying resources that may have either ID format.
   *
   * @param userId User identifier (internal USR... format)
   * @returns Array of all possible owner IDs for this user
   */
  getAllUserIds: (userId: string) => Promise<string[]>
}

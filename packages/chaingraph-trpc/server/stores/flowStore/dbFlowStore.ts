/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowMetadata } from '@badaitech/chaingraph-types'
import type { DBType } from '../../context'
import type { ListOrderBy } from '../postgres/store'
import type { IFlowStore } from './types'
import { Flow } from '@badaitech/chaingraph-types'
import { serializableFlow } from '../postgres/store'
import { deleteFlow, listFlows, loadFlow, saveFlow } from '../postgres/store'

const defaultFlowLimit = 1000

/**
 * In-memory implementation of flow storage
 */
export class DBFlowStore implements IFlowStore {
  private db: DBType
  private flows: Map<string, Flow> = new Map()

  constructor(db: DBType) {
    this.db = db
  }

  /**
   * Creates a new flow with given metadata
   * @param metadata Flow metadata
   * @returns Created flow ID
   */
  async createFlow(metadata: FlowMetadata): Promise<Flow> {
    const flow = new Flow(metadata)
    flow.metadata.version = await saveFlow(
      this.db,
      await serializableFlow(flow),
    )

    this.flows.set(flow.id, flow)

    return flow
  }

  /**
   * Retrieves flow by ID
   * @param flowId Flow identifier
   * @returns Flow instance or null if not found
   */
  async getFlow(flowId: string): Promise<Flow | null> {
    // get from cache first if not found then fetch from db
    const flow = this.flows.get(flowId)
    if (flow) {
      return flow
    }

    const flowFromDB = await loadFlow(this.db, flowId, (data) => {
      return Flow.deserialize(data)
    })
    if (!flowFromDB) {
      return null
    }

    this.flows.set(flowFromDB.id, flowFromDB as Flow)
    return flowFromDB as Flow
  }

  /**
   * Lists all available flows ordered by updatedAt desc
   * @returns Array of flows
   */
  async listFlows(
    ownerId: string,
    orderBy: ListOrderBy,
    limit: number,
  ): Promise<Flow[]> {
    // load all flows from DB and cache which is not in cache
    const flows = await listFlows(
      this.db,
      ownerId,
      orderBy,
      limit || defaultFlowLimit,
      (data) => {
        return Flow.deserialize(data)
      },
    )

    flows.forEach((flow) => {
      if (!this.flows.has(flow.id)) {
        this.flows.set(flow.id, flow as Flow)
      }
    })

    return Array.from(this.flows.values())
  }

  /**
   * Deletes flow
   * @param flowId Flow identifier
   * @returns true if flow was deleted, false if not found
   */
  async deleteFlow(flowId: string): Promise<boolean> {
    // delete from cache first
    this.flows.delete(flowId)

    // delete from db
    await deleteFlow(this.db, flowId)
    return true
  }

  /**
   * Updates flow with new data
   * @param flow Flow data
   * @returns Updated flow
   */
  async updateFlow(flow: Flow): Promise<Flow> {
    flow.metadata.version = await saveFlow(
      this.db,
      await serializableFlow(flow),
    )
    this.flows.set(flow.id, flow)
    return flow
  }

  /**
   * Checks if user has access to flow
   * @param flowId Flow identifier
   * @param userId User identifier
   * @returns true if user has access, false otherwise
   */
  async hasAccess(flowId: string, userId: string): Promise<boolean> {
    // get flow from cache
    let flow = this.flows.get(flowId)
    if (!flow) {
      // check if flow exists in db
      const flowFromDB = await this.getFlow(flowId)
      if (!flowFromDB) {
        return false
      }

      // add to cache
      this.flows.set(flowFromDB.id, flowFromDB)
      flow = flowFromDB
    }

    if (!flow) {
      return false
    }

    // check if user has access to flow
    const hasAccess = flow.metadata.ownerID === userId

    // TODO: add another checks for access for example if flow is public or user is in group

    return hasAccess
  }
}

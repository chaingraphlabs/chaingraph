/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionInstance } from '../types'

export interface IExecutionStore {
  create: (instance: ExecutionInstance) => Promise<void>
  get: (id: string) => Promise<ExecutionInstance | null>
  delete: (id: string) => Promise<boolean>
  list: (limit?: number) => Promise<ExecutionInstance[]>
}

export class InMemoryExecutionStore implements IExecutionStore {
  private instances: Map<string, ExecutionInstance> = new Map()

  async create(instance: ExecutionInstance): Promise<void> {
    this.instances.set(instance.id, instance)
  }

  async get(id: string): Promise<ExecutionInstance | null> {
    return this.instances.get(id) || null
  }

  async delete(id: string): Promise<boolean> {
    return this.instances.delete(id)
  }

  async list(limit?: number): Promise<ExecutionInstance[]> {
    const allInstances = Array.from(this.instances.values())
    if (limit) {
      return allInstances.slice(0, limit)
    }
    return allInstances
  }
}

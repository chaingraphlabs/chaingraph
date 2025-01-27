import type { ExecutionInstance } from '../types'

export interface IExecutionStore {
  create: (instance: ExecutionInstance) => Promise<void>
  get: (id: string) => Promise<ExecutionInstance | null>
  delete: (id: string) => Promise<boolean>
  list: () => Promise<ExecutionInstance[]>
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

  async list(): Promise<ExecutionInstance[]> {
    return Array.from(this.instances.values())
  }
}

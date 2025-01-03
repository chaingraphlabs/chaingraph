import type { PortConfig } from '../types'

/**
 * Ordered collection of key-value pairs maintaining insertion order
 */
export class OrderedMap<K, V> {
  private map = new Map<K, V>()
  private _order: K[] = []

  set(key: K, value: V): void {
    if (!this.map.has(key)) {
      this._order.push(key)
    }
    this.map.set(key, value)
  }

  get(key: K): V | undefined {
    return this.map.get(key)
  }

  has(key: K): boolean {
    return this.map.has(key)
  }

  delete(key: K): boolean {
    if (this.map.delete(key)) {
      this._order = this._order.filter(k => k !== key)
      return true
    }
    return false
  }

  clear(): void {
    this.map.clear()
    this._order = []
  }

  *entries(): IterableIterator<[K, V]> {
    for (const key of this._order) {
      yield [key, this.map.get(key)!]
    }
  }

  get size(): number {
    return this.map.size
  }

  get order(): readonly K[] {
    return this._order
  }
}

/**
 * Schema for object port
 */
export interface ObjectSchema {
  /** Ordered collection of fields */
  fields: OrderedMap<string, PortConfig>
}

/**
 * Configuration specific to object ports
 */
export interface ObjectPortConfig extends Omit<PortConfig, 'type' | 'defaultValue'> {
  type: 'object'
  schema: ObjectSchema
  defaultValue?: Record<string, unknown>
}

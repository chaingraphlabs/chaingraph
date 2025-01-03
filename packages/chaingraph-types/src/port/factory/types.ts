import type { Decimal } from 'decimal.js'
import type { IPort } from '../interface'
import type { PortConfig } from '../types'

/**
 * Maps port types to their value types
 */
export interface PortTypeMap {
  string: string
  number: Decimal
  boolean: boolean
  array: unknown[]
  object: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Port creator function type
 */
export type PortCreator<T extends keyof PortTypeMap> = (
  config: PortConfig
) => IPort<PortTypeMap[T]>

/**
 * Port factory registration information
 */
export interface PortFactoryEntry<T extends keyof PortTypeMap> {
  type: T
  creator: PortCreator<T>
}

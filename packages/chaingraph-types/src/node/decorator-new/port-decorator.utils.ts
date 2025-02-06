import type { PortDirection } from '@chaingraph/types/port-new/base'
import 'reflect-metadata'

/**
 * Retrieve the ports configuration map for the given class constructor.
 */
export function getPortsConfig(target: any): Map<string | symbol, any> {
  return Reflect.getMetadata('chaingraph:ports-config', target.constructor) || new Map()
}

/**
 * Updates the port configuration for the given property key with the specified direction.
 */
export function updatePortDirection(
  target: object,
  propertyKey: string | symbol,
  direction: PortDirection,
): void {
  const ctor = target.constructor
  const portsConfig: Map<string | symbol, any> = Reflect.getMetadata('chaingraph:ports-config', ctor) || new Map()
  const existingConfig = portsConfig.get(propertyKey) || {}
  existingConfig.direction = direction
  portsConfig.set(propertyKey, existingConfig)
  Reflect.defineMetadata('chaingraph:ports-config', portsConfig, ctor)
}

/**
 * Ensures that the port config has a key defined.
 */
export function ensurePortKey(propertyKey: string | symbol, config: { key?: string }): void {
  if (!config.key) {
    config.key = propertyKey.toString()
  }
}

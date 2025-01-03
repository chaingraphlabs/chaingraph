import type { IPort, PortType, PortValue } from '@chaingraph/types'

/**
 * Check if all ports in array are of the same type
 */
export function hasSamePortType<T extends PortType>(ports: IPort<T>[]): boolean {
  if (ports.length <= 1)
    return true
  const firstType = ports[0].config.type
  return ports.every(port => port.config.type === firstType)
}

/**
 * Extract values from array of ports
 */
export function extractPortValues<T extends PortType>(ports: IPort<T>[]): PortValue<T>[] {
  return ports.map(port => port.getValue())
}

/**
 * Find first port with value in array
 */
export function findFirstPortWithValue<T extends PortType>(ports: IPort<T>[]): IPort<T> | undefined {
  return ports.find(port => port.hasValue())
}

/**
 * Count ports with values
 */
export function countPortsWithValues<T extends PortType>(ports: IPort<T>[]): number {
  return ports.filter(port => port.hasValue()).length
}

/**
 * Check if all ports have values
 */
export function allPortsHaveValues<T extends PortType>(ports: IPort<T>[]): boolean {
  return ports.every(port => port.hasValue())
}

/**
 * Group ports by their type
 */
export function groupPortsByType<T extends PortType>(ports: IPort<T>[]): Map<PortType, IPort<T>[]> {
  return ports.reduce((groups, port) => {
    const type = port.config.type
    const group = groups.get(type) || []
    group.push(port)
    groups.set(type, group)
    return groups
  }, new Map<PortType, IPort<T>[]>())
}

/**
 * Validate all ports in array
 */
export async function validateAllPorts<T extends PortType>(ports: IPort<T>[]): Promise<boolean> {
  const results = await Promise.all(ports.map(port => port.validate()))
  return results.every(result => result)
}

/**
 * Clone array of ports
 */
export function clonePortArray<T extends PortType>(ports: IPort<T>[]): IPort<T>[] {
  return ports.map(port => port.clone())
}

/**
 * Reset all ports in array
 */
export function resetAllPorts<T extends PortType>(ports: IPort<T>[]): void {
  ports.forEach(port => port.reset())
}

/**
 * Type guard for port array
 */
export function isPortArray<T extends PortType>(value: unknown): value is IPort<T>[] {
  return Array.isArray(value) && value.every(item =>
    item && typeof item === 'object' && 'config' in item && 'value' in item,
  )
}

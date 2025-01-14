import type { PortConfig } from '@chaingraph/types/port'
import type { PortConstructor } from '@chaingraph/types/port/types/port-base'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import type { PortKind } from '@chaingraph/types/port/types/port-kind-enum'

export class PortRegistry {
  private static registry: Map<PortKind, PortConstructor<any>> = new Map()

  static register<C extends PortConfig>(kind: PortKind, constructor: PortConstructor<C>): void {
    if (this.registry.has(kind)) {
      throw new Error(`Port kind '${kind}' is already registered.`)
    }
    this.registry.set(kind, constructor)
  }

  static getConstructor<C extends PortConfig>(kind: PortKind): PortConstructor<C> {
    const constructor = this.registry.get(kind)
    if (!constructor) {
      throw new Error(`No port registered for kind '${kind}'.`)
    }
    return constructor as PortConstructor<C>
  }

  static getRegisteredPorts(): IPort<any>[] {
    const ports: IPort<any>[] = []
    this.registry.forEach((constructor, kind) => {
      ports.push(new constructor({ kind }))
    })

    return ports
  }
}

export function getPortConstructor<C extends PortConfig>(kind: PortKind): PortConstructor<C> {
  return PortRegistry.getConstructor(kind)
}

export function registerPort<C extends PortConfig>(kind: PortKind) {
  return function (constructor: new (config: C) => IPort<C>) {
    PortRegistry.register(kind, constructor)
  }
}

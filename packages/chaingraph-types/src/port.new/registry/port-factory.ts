import type { IPort } from '../base/port.interface'
import type { PortType } from '../config/constants'
import type { PortConfig } from '../config/types'

/**
 * Factory for creating port instances
 */
export class PortFactory {
  private static constructors = new Map<PortType, any>()

  /**
   * Register port constructor
   */
  static register(type: PortType, constructor: any): void {
    this.constructors.set(type, constructor)
  }

  /**
   * Create port instance
   */
  static create<T extends PortConfig>(config: T): IPort<T> {
    const Constructor = this.constructors.get(config.type)
    if (!Constructor) {
      throw new Error(`No port constructor registered for type '${config.type}'`)
    }
    return new Constructor(config)
  }
}

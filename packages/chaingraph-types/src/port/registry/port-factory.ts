import type { IPort, PortConfig } from '../types'
import { getPortConstructor } from './port-registry'

export class PortFactory {
  static create<C extends PortConfig>(config: C): IPort<C> {
    const constructor = getPortConstructor<C>(config.kind)
    if (!constructor) {
      throw new Error(`No port constructor found for kind '${config.kind}'.`)
    }
    return new constructor(config)
  }
}

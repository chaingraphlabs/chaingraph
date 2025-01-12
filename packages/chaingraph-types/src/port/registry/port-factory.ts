import type { PortConfig } from '../types'
import type { PortFromConfig } from './port-from-config'
import { getPortConstructor } from './port-registry'

export class PortFactory {
  static create<C extends PortConfig>(config: C): PortFromConfig<C> {
    const constructor = getPortConstructor<C>(config.kind)
    return (new constructor(config) as unknown) as PortFromConfig<C>
  }
}

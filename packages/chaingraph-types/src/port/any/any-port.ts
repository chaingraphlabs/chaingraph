import type { AnyPortConfig, IPort, PortConfig, PortValueFromConfig } from '../types'
import { PortFactory, registerPort } from '../registry'
import { PortBase, PortKind } from '../types'

@registerPort<AnyPortConfig>(PortKind.Any)
export class AnyPort extends PortBase<AnyPortConfig> {
  readonly config: AnyPortConfig
  value: any

  constructor(config: AnyPortConfig) {
    super()
    this.config = config
    this.value = config.defaultValue
  }

  getValue(): any {
    if (this.config.connectedPortConfig) {
      const expectedType = this.config.connectedPortConfig.kind
      return this.value as PortValueFromConfig<typeof this.config.connectedPortConfig>
    }
    return this.value
  }

  setValue(value: any): void {
    if (this.config.connectedPortConfig) {
      // Determine the expected type from connectedPortConfig
      const port = PortFactory.create(this.config.connectedPortConfig)
      port.setValue(value as never)
      if (!port.validate()) {
        throw new Error('Invalid value for connected port')
      }

      this.value = port.getValue()
    } else {
      // Accept any value when not connected
      this.value = value
    }
  }

  validate(): boolean {
    // If connected, delegate validation to the connected port's config
    if (this.config.connectedPortConfig) {
      // Implement validation logic based on connectedPortConfig
      return true
    }
    // If not connected, accept any value
    return true
  }

  reset(): void {
    this.value = this.config.defaultValue
  }

  hasValue(): boolean {
    return this.value !== undefined && this.value !== null
  }

  clone(): IPort<AnyPortConfig> {
    return new AnyPort({ ...this.config, defaultValue: this.value })
  }

  // Method to connect to an output port
  connect(connectedPortConfig: PortConfig): void {
    this.config.connectedPortConfig = connectedPortConfig
    // Update the value type and other properties if necessary
  }

  // Method to disconnect from the output port
  disconnect(): void {
    this.config.connectedPortConfig = null
    // Reset to default or undefined value
    this.reset()
  }

  static isAnyPortConfig(config: any): config is AnyPortConfig {
    return config.kind === PortKind.Any
  }
}
//
// superjson.registerCustom<AnyPort, JSONValue>(
//   {
//     isApplicable: (v): v is AnyPort => v instanceof AnyPort,
//     serialize: v => v.serializePort(),
//     deserialize: v => PortBase.deserializePort(v) as unknown as AnyPort,
//   },
//   PortKindEnum.Any,
// )

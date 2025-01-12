import type { PortConfig, PortValueFromConfig } from '@chaingraph/types/port/types/port-composite-types'
import type { AnyPortConfig } from '@chaingraph/types/port/types/port-config'
import type { IPort } from '../types/port-interface'
import { PortBase } from '@chaingraph/types/port/types/port-base'

// do not change import path! because it will brake the right import order

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
      // const expectedType = this.config.connectedPortConfig.kind

      // Perform type checking
      // if (expectedType === 'string' && typeof value !== 'string') {
      //   throw new TypeError('Value must be a string')
      // } else if (expectedType === 'number' && typeof value !== 'number') {
      //   throw new TypeError('Value must be a number')
      // }
      // Add other type checks as needed

      this.value = value
    } else {
      // Accept any value when not connected
      this.value = value
    }
  }

  async validate(): Promise<boolean> {
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
}

import type { PortFromConfig } from '@chaingraph/types/port/registry/port-from-config'
import type { PortConfig } from '@chaingraph/types/port/types/port-composite-types'
import type { EnumPortConfig } from '@chaingraph/types/port/types/port-config'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import { PortFactory } from '@chaingraph/types/port/registry/port-factory'
import { registerPort } from '@chaingraph/types/port/registry/port-registry'
import { PortBase } from '@chaingraph/types/port/types/port-base'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'

@registerPort<EnumPortConfig<any>>(PortKindEnum.Enum)
export class EnumPort<E extends PortConfig> extends PortBase<EnumPortConfig<E>> {
  readonly config: EnumPortConfig<E>
  value: string | null
  private readonly optionPorts: Array<PortFromConfig<E>>

  constructor(config: EnumPortConfig<E>) {
    super()

    this.config = config
    this.value = config.defaultValue ?? null
    this.optionPorts = []

    // Initialize option ports
    for (const optionConfig of config.options) {
      this.optionPorts.push(PortFactory.create(optionConfig))
    }
  }

  getValue(): string | null {
    return this.value
  }

  setValue(value: string | null): void {
    if (value === null) {
      this.value = null
    } else if (this.optionPorts.some(port => port.config.id === value)) {
      this.value = value
    } else {
      throw new Error(`Invalid value '${value}'. Must be one of the option IDs.`)
    }
  }

  getSelectedOption(): PortFromConfig<E> | null {
    if (this.value === null) {
      return null
    }
    return this.getOptionById(this.value) ?? null
  }

  getOptionById(id: string) {
    return this.optionPorts.find(port => port.config.id === id)
  }

  getOptions(): PortFromConfig<E>[] {
    return this.optionPorts
  }

  addOption(optionConfig: E): void {
    const existing = this.optionPorts.find(port => port.config.id === optionConfig.id)
    if (existing) {
      throw new Error(`Option with id '${optionConfig.id}' already exists.`)
    }
    this.optionPorts.push(PortFactory.create(optionConfig))
  }

  addOptions(optionConfigs: E[]): void {
    for (const optionConfig of optionConfigs) {
      this.addOption(optionConfig)
    }
  }

  removeOption(id: string): void {
    const index = this.optionPorts.findIndex(port => port.config.id === id)
    if (index === -1) {
      throw new Error(`Option with id '${id}' does not exist.`)
    }
    this.optionPorts.splice(index, 1)
    if (this.value === id) {
      this.value = null
    }
  }

  validate(): boolean {
    if (this.value === null) {
      return false // No value selected
    }
    const selectedPort = this.getSelectedOption()
    if (selectedPort) {
      return selectedPort.validate()
    }
    return false
  }

  reset(): void {
    this.value = this.config.defaultValue ?? null
  }

  hasValue(): boolean {
    return this.value !== null
  }

  clone(): IPort<EnumPortConfig<E>> {
    return new EnumPort({ ...this.config, defaultValue: this.value ?? undefined })
  }

  static isEnumPortConfig<E extends PortConfig>(config: any): config is EnumPortConfig<E> {
    return config.kind === PortKindEnum.Enum
  }
}

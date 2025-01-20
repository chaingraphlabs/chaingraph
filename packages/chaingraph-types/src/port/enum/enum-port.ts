import type { EnumPortConfig, IPort, PortConfig } from '../types'
import { registerPort } from '../registry'
import { PortBase, PortKind } from '../types'

@registerPort<EnumPortConfig<any>>(PortKind.Enum)
export class EnumPort<E extends PortConfig> extends PortBase<EnumPortConfig<E>> {
  readonly config: EnumPortConfig<E>
  value: string | null

  constructor(config: EnumPortConfig<E>) {
    super()

    this.config = config
    this.value = config.defaultValue ?? null
  }

  getValue(): string | null {
    return this.value
  }

  setValue(value: string | null): void {
    if (value === null) {
      this.value = null
    } else if (this.config.options.some(port => port.id === value)) {
      this.value = value
    } else {
      throw new Error(`Invalid value '${value}'. Must be one of the option IDs.`)
    }
  }

  getSelectedOption(): E | null {
    if (this.value === null) {
      return null
    }
    return this.getOptionById(this.value) ?? null
  }

  getOptionById(id: string) {
    return this.config.options.find(port => port.id === id)
  }

  getOptions(): E[] {
    return this.config.options
  }

  addOption(optionConfig: E): void {
    const existing = this.config.options.find(port => port.id === optionConfig.id)
    if (existing) {
      throw new Error(`Option with id '${optionConfig.id}' already exists.`)
    }
    this.config.options.push(optionConfig)
  }

  addOptions(optionConfigs: E[]): void {
    for (const optionConfig of optionConfigs) {
      this.addOption(optionConfig)
    }
  }

  removeOption(id: string): void {
    const index = this.config.options.findIndex(port => port.id === id)
    if (index === -1) {
      throw new Error(`Option with id '${id}' does not exist.`)
    }
    this.config.options.splice(index, 1)
    if (this.value === id) {
      this.value = null
    }
  }

  validate(): boolean {
    // TODO: Implement validation logic
    return true
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
    return config.kind === PortKind.Enum
  }
}

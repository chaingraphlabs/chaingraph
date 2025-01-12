import type { JSONValue } from 'superjson/dist/types'
import type { PortConfig, PortValueFromConfig } from './port-composite-types'
import type { PortDirection } from './port-direction'
import type { IPort } from './port-interface'
import type { PortKindEnum } from './port-kind-enum'
import superjson from 'superjson'
import { PortFactory } from '../port-factory'
import { PortConfigDiscriminator } from './port-config'
import { PortValueSchema } from './port-value'
import { isPortConfig } from './type-guards'

export abstract class PortBase<C extends PortConfig> implements IPort<C> {
  abstract readonly config: C
  abstract value: PortValueFromConfig<C>

  abstract getValue(): PortValueFromConfig<C>
  abstract setValue(value: PortValueFromConfig<C>): void
  abstract validate(): Promise<boolean>
  abstract reset(): void
  abstract hasValue(): boolean
  abstract clone(): IPort<C>

  get id(): string {
    return this.config.id ?? ''
  }

  get key(): string {
    return this.config.key ?? ''
  }

  get description(): string {
    return this.config.description ?? ''
  }

  get kind(): PortKindEnum {
    return this.config.kind
  }

  get title(): string {
    return this.config.title ?? ''
  }

  get optional(): boolean {
    return this.config.optional ?? false
  }

  get required(): boolean {
    return !this.optional
  }

  get defaultValue(): PortValueFromConfig<C> {
    return this.config.defaultValue
  }

  get direction(): PortDirection | undefined {
    return this.config.direction
  }

  get parentId(): string | undefined {
    return this.config.parentId
  }

  get nodeId(): string | undefined {
    return this.config.nodeId
  }

  metadata(key: string): unknown {
    return this.config.metadata?.[key]
  }

  setMetadata(key: string, value: unknown): void {
    if (!this.config.metadata) {
      this.config.metadata = {}
    }
    this.config.metadata[key] = value
  }

  get name(): string {
    return this.config.kind
  }

  deserialize(v: JSONValue): IPort<C> {
    if (v === null || v === undefined) {
      throw new Error('Cannot deserialize null or undefined')
    }

    if (typeof v !== 'object') {
      throw new TypeError('Cannot deserialize non-object port')
    }

    if (!('config' in v) || !('value' in v)) {
      throw new Error('Cannot deserialize port without config and value')
    }

    if (!isPortConfig(v.config)) {
      throw new Error('Cannot deserialize port with invalid config')
    }

    if (v.config.kind !== this.config.kind) {
      throw new Error(`Cannot deserialize port with different kind, expected ${this.config.kind}, got ${v.config.kind}`)
    }

    const validatedConfig = PortConfigDiscriminator.parse(v.config)
    if (!validatedConfig) {
      throw new Error('Cannot deserialize port with invalid config')
    }

    if (validatedConfig.kind !== this.config.kind) {
      throw new Error(`Cannot deserialize port with different kind, expected ${this.config.kind}, got ${validatedConfig.kind}`)
    }

    const validatedValue = PortValueSchema.parse(v.value)

    const port = PortFactory.create(validatedConfig as C)
    port.setValue(validatedValue as never)

    // TODO: is there better way to infer the type?
    return (port as unknown) as IPort<C>
  }

  serialize(v: IPort<C>): JSONValue {
    return {
      config: v.config,
      value: v.getValue(),
    } as JSONValue
  }

  isApplicable(v: any): v is IPort<C> {
    if (v === null || v === undefined) {
      return false
    }

    if (typeof v !== 'object' || !('config' in v) || !('value' in v)) {
      return false
    }

    if (!isPortConfig(v.config)) {
      return false
    }

    if (v.config.kind !== this.config.kind) {
      return false
    }

    try {
      PortConfigDiscriminator.parse(v.config)
      return true
    } catch {
      return false
    }
  }

  registerSuperjson(): void {
    superjson.registerCustom<IPort<C>, JSONValue>(this, this.name)
  }
}

import type { JSONValue, SuperJSONResult } from 'superjson/dist/types'
import type { PortConfig, PortValueFromConfig } from './port-config'
import type { PortDirectionUnion } from './port-direction-union'
import type { IPort } from './port-interface'
import type { PortKind } from './port-kind'
import { parsePortConfig } from '@chaingraph/types/port/types/port-config-parsing.zod'
import superjson from 'superjson'
import { PortFactory } from '../registry'

export type PortConstructor<C extends PortConfig> = new (config: C) => IPort<C>

// export abstract class PortBase<C extends PortConfig> implements IPort<C> {
export abstract class PortBase<C extends PortConfig> implements IPort<C> {
  abstract readonly config: C
  abstract value: PortValueFromConfig<C>

  abstract getValue(): PortValueFromConfig<C>
  abstract setValue(value: PortValueFromConfig<C>): void
  abstract validate(): boolean
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

  get kind(): PortKind {
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

  get direction(): PortDirectionUnion | undefined {
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

  serializePort(): JSONValue {
    return superjson.serialize({
      config: this.config,
      value: this.getValue(),
    }) as unknown as JSONValue
  }

  deserializePort(serializedPort: JSONValue): IPort<C> {
    const deserializedPort = superjson.deserialize<{
      config: any
      value: any
    }>(serializedPort as unknown as SuperJSONResult)

    // validate config
    const portConfig = parsePortConfig(deserializedPort.config)

    // const port = PortFactory.create(deserializedPort.config as C)
    const port = PortFactory.create(portConfig as C)
    port.setValue(deserializedPort.value as never)

    return port
  }
}

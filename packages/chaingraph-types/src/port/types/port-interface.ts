import type {
  PortConfig,
  PortDirection,
  PortKindEnum,
  PortValueFromConfig,
} from '@chaingraph/types/port'
import type { CustomTransfomer } from 'superjson/dist/custom-transformer-registry'

import type { JSONObject } from 'superjson/dist/types'
import {
  isPortConfig,
} from '@chaingraph/types/port'
import superjson from 'superjson'

export interface IPort<C extends PortConfig> extends CustomTransfomer<IPort<C>, JSONObject> {
  readonly className: string
  readonly config: C
  value: PortValueFromConfig<C>

  getValue: () => PortValueFromConfig<C>
  setValue: (value: PortValueFromConfig<C>) => void
  validate: () => Promise<boolean>
  reset: () => void
  hasValue: () => boolean
  clone: () => IPort<C>

  // superjson serialization methods
  readonly name: string
  isApplicable: (v: any) => v is IPort<C>
  deserialize: (v: JSONObject) => IPort<C>
  serialize: (v: IPort<C>) => JSONObject
}

export abstract class PortBase<C extends PortConfig> implements IPort<C> {
  abstract readonly className: string
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

  abstract deserialize(v: JSONObject): IPort<C>

  serialize(v: IPort<C>): JSONObject {
    return {
      className: v.className,
      config: superjson.stringify({ ...v.config }),
      value: superjson.stringify(v.getValue()),
    }
  }

  get name(): string {
    return this.className
  }

  isApplicable(v: any): v is IPort<C> {
    if (v === null || v === undefined) {
      return false
    }

    if (typeof v !== 'object' || !('config' in v) || !('value' in v) || !('className' in v)) {
      return false
    }

    if (!isPortConfig(v.config)) {
      return false
    }

    return !(
      v.config.kind !== this.config.kind
      || v.className !== this.className
    )
  }

  registerSuperjson() {
    superjson.registerCustom<IPort<C>, JSONObject>(this, this.className)
  }
}

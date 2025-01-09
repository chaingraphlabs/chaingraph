import type {
  PortConfig,
  PortDirection,
  PortKindEnum,
  PortValueFromConfig,
} from '@chaingraph/types/port'

export interface IPort<C extends PortConfig> {
  readonly config: C
  value: PortValueFromConfig<C>

  getValue: () => PortValueFromConfig<C>
  setValue: (value: PortValueFromConfig<C>) => void
  validate: () => Promise<boolean>
  reset: () => void
  hasValue: () => boolean
  clone: () => IPort<C>
}

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

  get name(): string {
    return this.config.name ?? ''
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
}

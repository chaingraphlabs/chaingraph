import type {
  AnyPort,
  ArrayPort,
  BooleanPort,
  EnumPort,
  NumberPort,
  ObjectPort,
  ObjectPortValueFromSchema,
  StringPort,
} from '@chaingraph/types'
import type { MultiChannel } from '@chaingraph/types/port/channel/multi-channel'
import type { StreamInputPort } from '@chaingraph/types/port/stream/stream-input-port'
import type { StreamOutputPort } from '@chaingraph/types/port/stream/stream-output-port'
import type {
  AnyPortConfig,
  ArrayPortConfig,
  BooleanPortConfig,
  EnumPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  StreamInputPortConfig,
  StreamOutputPortConfig,
  StringPortConfig,
} from '@chaingraph/types/port/types/port-config'
import type { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'
import type { NumberPortValue } from '@chaingraph/types/port/types/port-value'

export type PortConfig =
  | StringPortConfig
  | NumberPortConfig
  | BooleanPortConfig
  | ArrayPortConfig<any>
  | ObjectPortConfig<any>
  | AnyPortConfig
  | EnumPortConfig<any>
  | StreamOutputPortConfig<any>
  | StreamInputPortConfig<any>

export type PortFromConfig<C extends PortConfig> =
  C extends StringPortConfig ? StringPort :
    C extends NumberPortConfig ? NumberPort :
      C extends BooleanPortConfig ? BooleanPort :
        C extends ArrayPortConfig<infer E> ? ArrayPort<E> :
          C extends ObjectPortConfig<infer S> ? ObjectPort<S> :
            C extends AnyPortConfig ? AnyPort :
              C extends EnumPortConfig<infer E> ? EnumPort<E> :
                C extends StreamOutputPortConfig<infer T> ? StreamOutputPort<T> :
                  C extends StreamInputPortConfig<infer T> ? StreamInputPort<T> :
                    never

export type PortValueFromConfig<C extends PortConfig> =
  C extends StringPortConfig ? string :
    C extends NumberPortConfig ? NumberPortValue :
      C extends BooleanPortConfig ? boolean :
        C extends ArrayPortConfig<infer E> ? Array<PortValueFromConfig<E>> :
          C extends ObjectPortConfig<infer S> ? ObjectPortValueFromSchema<S> :
            C extends AnyPortConfig ? any :
              C extends EnumPortConfig<any> ? string | null :
                C extends StreamOutputPortConfig<infer T> ? MultiChannel<T> | null :
                  C extends StreamInputPortConfig<infer T> ? MultiChannel<T> | null :
                    never

export type PortValueByKind<K extends PortKindEnum> = PortValueFromConfig<PortConfigByKind<K>>

export type PortConfigByKind<K extends PortKindEnum> =
  K extends PortKindEnum.String ? StringPortConfig :
    K extends PortKindEnum.Number ? NumberPortConfig :
      K extends PortKindEnum.Boolean ? BooleanPortConfig :
        K extends PortKindEnum.Array ? ArrayPortConfig<any> :
          K extends PortKindEnum.Object ? ObjectPortConfig<any> :
            K extends PortKindEnum.Any ? AnyPortConfig :
              K extends PortKindEnum.Enum ? EnumPortConfig<any> :
                K extends PortKindEnum.StreamOutput ? StreamOutputPortConfig<any> :
                  K extends PortKindEnum.StreamInput ? StreamInputPortConfig<any> :
                    never

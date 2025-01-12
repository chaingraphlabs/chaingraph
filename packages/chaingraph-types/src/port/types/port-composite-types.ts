import type { MultiChannel } from '../channel'
import type {
  ObjectPortValueFromSchema,
} from './object-schema'
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
} from './port-config'
import type { PortKindEnum } from './port-kind-enum'
import type { NumberPortValue } from './port-value'

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

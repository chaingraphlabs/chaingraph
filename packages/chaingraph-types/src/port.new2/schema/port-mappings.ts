import type {
  IArrayPortConfig,
  IBooleanPortConfig,
  IEnumPortConfig,
  INumberPortConfig,
  IObjectPortConfig,
  IStringPortConfig,
} from './port-configs'
// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-mappings.ts
import type { PortTypeEnum } from './port-types.enum'
import type {
  IArrayPortValue,
  IBooleanPortValue,
  IEnumPortValue,
  INumberPortValue,
  IObjectPortValue,
  IStringPortValue,
} from './port-value-types'

/*
  Mapping for Port Values based on the discriminator.
*/
export type PortValueMapping<T extends PortTypeEnum> =
  T extends PortTypeEnum.String ? IStringPortValue :
    T extends PortTypeEnum.Number ? INumberPortValue :
      T extends PortTypeEnum.Boolean ? IBooleanPortValue :
        T extends PortTypeEnum.Array ? IArrayPortValue :
          T extends PortTypeEnum.Object ? IObjectPortValue :
            T extends PortTypeEnum.Enum ? IEnumPortValue :
              never

/*
  Mapping for Port Configurations based on the discriminator.
*/
export type PortConfigMapping<T extends PortTypeEnum> =
  T extends PortTypeEnum.String ? IStringPortConfig :
    T extends PortTypeEnum.Number ? INumberPortConfig :
      T extends PortTypeEnum.Boolean ? IBooleanPortConfig :
        T extends PortTypeEnum.Array ? IArrayPortConfig :
          T extends PortTypeEnum.Object ? IObjectPortConfig :
            T extends PortTypeEnum.Enum ? IEnumPortConfig :
              never

/*
  A unified Port definition that composes the corresponding config and value.
*/
export interface DefinedPort<T extends PortTypeEnum> {
  config: PortConfigMapping<T>
  value: PortValueMapping<T>
}

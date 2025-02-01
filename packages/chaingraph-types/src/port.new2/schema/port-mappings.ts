import type { ArrayPortConfig } from './port-array'
import type { EnumPortConfig } from './port-enum'
import type { ObjectPortConfig } from './port-object'
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
import type {
  ScalarBooleanPortConfig,
  ScalarNumberPortConfig,
  ScalarStringPortConfig,
} from './scalar'

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
  T extends PortTypeEnum.String ? ScalarStringPortConfig :
    T extends PortTypeEnum.Number ? ScalarNumberPortConfig :
      T extends PortTypeEnum.Boolean ? ScalarBooleanPortConfig :
        T extends PortTypeEnum.Array ? ArrayPortConfig :
          T extends PortTypeEnum.Object ? ObjectPortConfig :
            T extends PortTypeEnum.Enum ? EnumPortConfig :
              never

/*
  A unified Port definition that composes the corresponding config and value.
*/
export interface DefinedPort<T extends PortTypeEnum> {
  config: PortConfigMapping<T>
  value: PortValueMapping<T>
}

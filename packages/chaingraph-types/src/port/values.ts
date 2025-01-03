import type { Decimal } from 'decimal.js'

/**
 * Core value types that can be stored in ports
 */
export enum PortValueType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
}

/**
 * Type mapping for port values
 */
export type PortValue<T extends PortValueType> =
  T extends PortValueType.String ? string :
    T extends PortValueType.Number ? Decimal :
      T extends PortValueType.Boolean ? boolean :
        T extends PortValueType.Array ? PortValue<any>[] :
          never

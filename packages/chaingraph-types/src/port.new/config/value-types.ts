import type { PortType } from './constants'
import type { PortConfig } from './types'

/**
 * Get value type from port configuration
 */
export type PortValueType<T extends PortConfig> = T extends { type: PortType }
  ? T['type'] extends PortType.String ? string
    : T['type'] extends PortType.Number ? number
      : T['type'] extends PortType.Boolean ? boolean
        : T['type'] extends PortType.Array ? T extends { elementConfig: PortConfig }
          ? Array<PortValueType<T['elementConfig']>> : never
          : T['type'] extends PortType.Object
            ? T extends { schema: { properties: Record<string, PortConfig> } }
              ? { [K in keyof T['schema']['properties']]: PortValueType<T['schema']['properties'][K]> }
              : never
            : T['type'] extends PortType.Stream
              ? T extends { valueType: PortConfig }
                ? PortValueType<T['valueType']>
                : never
              : T['type'] extends PortType.Enum
                ? string
                : T['type'] extends PortType.Any
                  ? unknown
                  : never
  : never

/**
 * Get value type from port type
 */
export type ValueTypeFromPortType<T extends PortType> = T extends PortType.String
  ? string : T extends PortType.Number
    ? number : T extends PortType.Boolean
      ? boolean : T extends PortType.Array
        ? unknown[] : T extends PortType.Object
          ? Record<string, unknown> : T extends PortType.Stream
            ? unknown : T extends PortType.Enum
              ? string : T extends PortType.Any
                ? unknown : never

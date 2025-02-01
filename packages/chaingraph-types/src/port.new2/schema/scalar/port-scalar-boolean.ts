import type { BasePortConfig, Port } from '../port'
import type { PortValueBoolean } from '../port-value-types'

/*
  Scalar (boolean) Port configuration.
  Extending BasePortConfig with a literal type 'boolean'.
*/
export type ScalarBooleanPortConfig = BasePortConfig & { type: 'boolean' }

/*
  Final Scalar Boolean Port type.
*/
export type ScalarBooleanPort = Port<'boolean', ScalarBooleanPortConfig, PortValueBoolean>

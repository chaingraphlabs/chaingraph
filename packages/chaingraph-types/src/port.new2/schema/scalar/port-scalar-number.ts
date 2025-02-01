import type { BasePortConfig, Port } from '../port'
import type { PortValueNumber } from '../port-value-types'

/*
  Scalar (number) Port configuration.
  Extending BasePortConfig with a literal type 'number'.
*/
export type ScalarNumberPortConfig = BasePortConfig & { type: 'number' }

/*
  Final Scalar Number Port type.
*/
export type ScalarNumberPort = Port<'number', ScalarNumberPortConfig, PortValueNumber>

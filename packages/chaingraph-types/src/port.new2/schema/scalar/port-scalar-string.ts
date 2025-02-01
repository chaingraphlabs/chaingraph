import type { BasePortConfig, Port } from '../port'
import type { PortValueString } from '../port-value-types'

/*
  Scalar (string) Port configuration.
  Extending BasePortConfig with a literal type 'string'.
*/
export type ScalarStringPortConfig = BasePortConfig & { type: 'string' }

/*
  Final Scalar String Port type.
*/
export type ScalarStringPort = Port<'string', ScalarStringPortConfig, PortValueString>

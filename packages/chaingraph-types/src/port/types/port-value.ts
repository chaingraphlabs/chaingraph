/*
 * * * * * * * * * * *
 * Port Value
 * * * * * * * * * * *
 */

import Decimal from 'decimal.js'
import { z } from 'zod'

export type NumberPortValue = number | string | Decimal
export const NumberPortValueSchema = z.union([
  z.number(),
  z.string(),
  z.instanceof(Decimal),
])

export const PortValueSchema = z.union([
  z.string(),
  NumberPortValueSchema,
  z.boolean(),
  z.array(z.any()),
  z.record(z.string(), z.any()),
  z.unknown(),
  z.null(),
])

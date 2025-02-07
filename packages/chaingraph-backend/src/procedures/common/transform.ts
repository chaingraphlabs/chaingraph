/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { publicProcedure } from '../../trpc'

export const toUpperCase = publicProcedure
  .input(z.string())
  .query(({ input }) => {
    return input.toUpperCase()
  })

export const complexData = publicProcedure
  .query(() => {
    return {
      date: new Date(),
      map: new Map([['key', 'value']]),
      set: new Set([1, 2, 3]),
      bigint: BigInt(9007199254740991),
      nested: {
        array: [1, 2, 3],
        null: null,
      },
    }
  })

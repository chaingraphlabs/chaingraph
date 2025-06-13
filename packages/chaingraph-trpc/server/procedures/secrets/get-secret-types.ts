/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  secretTypeMetadata,
  secretTypeSchemas,
} from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { authedProcedure } from '../../trpc'

const secretTypesResponse = Object.fromEntries(
  Object.entries(secretTypeMetadata).map(([key, metadata]) => [key, {
    metadata,
    schema: zodToJsonSchema(secretTypeSchemas[key]),
  }]),
)

/**
 * Retrieves a record of secret types.
 */
export const getSecretTypes = authedProcedure.input(z.void()).query(async () => {
  return secretTypesResponse
})

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { router } from '../../trpc'
import { getSecretTypes } from './get-secret-types'

/**
 * A TRPC router for handling secret-related procedures.
 */
export const secretProcedures = router({
  getSecretTypes,
})

export { getSecretTypes } from './get-secret-types'

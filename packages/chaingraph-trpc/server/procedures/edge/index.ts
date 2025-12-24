/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { router } from '../../trpc'
import { updateAnchors } from './update-anchors'

/**
 * Edge procedures sub-router
 * Accessible via client.edge.*
 */
export const edgeProcedures = router({
  updateAnchors,
})

export { updateAnchors } from './update-anchors'

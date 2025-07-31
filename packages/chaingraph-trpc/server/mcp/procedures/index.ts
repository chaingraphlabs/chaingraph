/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { router } from '../../trpc'
import { createServer } from './create-server'
import { deleteServer } from './delete-server'
import { listServers } from './list-servers'
import { updateServer } from './update-server'

export const mcpProcedures = router({
  listServers,
  createServer,
  updateServer,
  deleteServer,
})

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { router } from '../../trpc'
import { addPromptToFlow } from './add-prompt-to-flow'
import { addResourceToFlow } from './add-resource-to-flow'
import { addToolToFlow } from './add-tool-to-flow'
import { buildPromptNode } from './build-prompt-node'
import { buildResourceNode } from './build-resource-node'
import { buildToolNode } from './build-tool-node'
import { createServer } from './create-server'
import { deleteServer } from './delete-server'
import { getAllNodesForServer } from './get-all-nodes-for-server'
import { listServers } from './list-servers'
import { serverCapabilities } from './server-capabilities'
import { updateServer } from './update-server'

export const mcpProcedures = router({
  // Server management
  listServers,
  createServer,
  updateServer,
  deleteServer,

  // Capability fetching
  serverCapabilities,

  // Node building
  buildToolNode,
  buildResourceNode,
  buildPromptNode,
  getAllNodesForServer,

  // Add to flow
  addToolToFlow,
  addResourceToFlow,
  addPromptToFlow,
})

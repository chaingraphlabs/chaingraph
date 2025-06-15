/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { router } from '../../trpc'
import { addNode } from './add-node'
import { connectPorts } from './connect-ports'
import { create } from './flow-create'
import { flowDelete } from './flow-delete'
import { edit } from './flow-edit'
import { get } from './flow-get'
import { getMeta } from './flow-get-meta'
import { list } from './flow-list'
import { pasteNodes } from './paste-nodes'
import { removeEdge } from './remove-edge'
import { removeNode } from './remove-node'
import { subscribeToEvents } from './subscriptions'
import { updateNodeParent } from './update-node-parent'
import { updateNodePosition } from './update-node-position'
import { updateNodeUI } from './update-node-ui'
import { updatePortUI } from './update-port-ui'
import {
  addFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
  removeFieldObjectPort,
  updateItemConfigArrayPort,
  updatePortValue,
} from './update-port-value'

export const flowProcedures = router({
  create,
  get,
  getMeta,
  list,
  delete: flowDelete,
  edit,
  subscribeToEvents,
  addNode,
  removeNode,
  pasteNodes,
  connectPorts,
  removeEdge,
  updateNodeUI,
  updateNodePosition,
  updateNodeParent,
  updatePortValue,
  updatePortUI,
  addFieldObjectPort,
  removeFieldObjectPort,
  updateItemConfigArrayPort,
  appendElementArrayPort,
  removeElementArrayPort,
})

export { addNode } from './add-node'
export { connectPorts } from './connect-ports'
export { create } from './flow-create'
export { flowDelete } from './flow-delete'
export { edit } from './flow-edit'
export { get } from './flow-get'
export { getMeta } from './flow-get-meta'
export { list } from './flow-list'
export { pasteNodes } from './paste-nodes'
export type { PasteNodesClipboardDataType, PasteNodesInputType } from './paste-nodes'
export { removeEdge } from './remove-edge'
export { removeNode } from './remove-node'
export { subscribeToEvents } from './subscriptions'
export { updateNodeParent } from './update-node-parent'
export { updateNodePosition } from './update-node-position'
export { updateNodeUI } from './update-node-ui'
export { updatePortUI } from './update-port-ui'
export {
  addFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
  removeFieldObjectPort,
  updateItemConfigArrayPort,
  updatePortValue,
} from './update-port-value'

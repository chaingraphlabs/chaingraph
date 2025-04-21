/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { sample } from 'effector'
import {
  LOCAL_NODE_UI_DEBOUNCE_MS,
  NODE_POSITION_DEBOUNCE_MS,
  NODE_UI_DEBOUNCE_MS,
} from './constants'
import {
  addNodeToFlowFx,
  baseUpdateNodePositionFx,
  removeNodeFromFlowFx,
  updateNodeParentFx,
  updateNodeUIFx,
} from './effects'
import {
  addNodeToFlow,
  removeNodeFromFlow,
  setNodeVersion,
  updateNodeParent,
  updateNodePosition,
  updateNodePositionInterpolated,
  updateNodePositionLocal,
  updateNodeUI,
  updateNodeUILocal,
} from './events'
import { accumulateAndSample } from './operators/accumulate-and-sample'
import { positionInterpolator } from './position-interpolation-advanced'
import { $nodes } from './stores'
import './interpolation-init'

export function init() {
// * * * * * * * * * * * * * * *
  // CRUD operations
  // * * * * * * * * * * * * * * *
  // Handle backend node operations
  sample({
    clock: addNodeToFlow,
    target: addNodeToFlowFx,
  })

  sample({
    clock: removeNodeFromFlow,
    target: removeNodeFromFlowFx,
  })

  // * * * * * * * * * * * * * * *
  // Position operations
  // * * * * * * * * * * * * * * *

  // Update local position immediately with small debounce
  const throttledUpdateNodePositionLocal = accumulateAndSample({
    source: [updateNodePosition],
    timeout: LOCAL_NODE_UI_DEBOUNCE_MS,
    getKey: update => update.nodeId,
  })

  sample({
    clock: throttledUpdateNodePositionLocal,
    // clock: updateNodePosition,
    target: [updateNodePositionLocal],
  })

  // throttled node position updates
  const throttledUpdatePosition = accumulateAndSample({
    source: [updateNodePosition],
    timeout: NODE_POSITION_DEBOUNCE_MS,
    getKey: update => update.nodeId,
  })

  // Update local node version and send the updated position to the server
  sample({
    clock: throttledUpdatePosition,
    source: $nodes,
    fn: (nodes, params) => ({
      ...params,
      version: (nodes[params.nodeId]?.getVersion() ?? 0) + 1,
    }),
    target: [setNodeVersion, baseUpdateNodePositionFx],
  })

  // * * * * * * * * * * * * * * *
  // Node operations
  // * * * * * * * * * * * * * * *

  // On node parent update, update the local node version and send the updated parent to the server
  sample({
    clock: updateNodeParent,
    source: $nodes,
    fn: (nodes, params) => ({
      ...params,
      version: (nodes[params.nodeId].getVersion() ?? 0) + 1,
    }),
    target: [setNodeVersion, updateNodeParentFx],
  })

  // * * * * * * * * * * * * * * *
  // Node UI operations
  // * * * * * * * * * * * * * * *

  // Handle optimistic updates
  const throttledUpdateNodeUILocal = accumulateAndSample({
    source: [updateNodeUI],
    timeout: LOCAL_NODE_UI_DEBOUNCE_MS,
    getKey: update => update.nodeId,
  })

  sample({
    clock: throttledUpdateNodeUILocal,
    target: [updateNodeUILocal],
  })

  const throttledUIUpdate = accumulateAndSample({
    source: [updateNodeUI],
    timeout: NODE_UI_DEBOUNCE_MS,
    getKey: update => update.nodeId,
  })

  // Create middleware to update the version of the node before sending it to the server
  sample({
    clock: throttledUIUpdate,
    source: $nodes,
    fn: (nodes, params) => {
      return {
        ...params,
        version: (nodes[params.nodeId].getVersion() ?? 0) + 1,
      }
    },
    target: [setNodeVersion, updateNodeUIFx],
  })

  // Initialize interpolator update handler
  positionInterpolator.onUpdate = (nodeId, position) => {
    updateNodePositionInterpolated({
      nodeId,
      position,
    })
  }

  positionInterpolator.start()
}

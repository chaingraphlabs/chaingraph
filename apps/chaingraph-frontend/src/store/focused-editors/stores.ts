/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { BlurPortEditorEvent, FocusedPortEditor, FocusPortEditorEvent } from './types'
import { focusedEditorsDomain } from '@/store/domains'
import { combine } from 'effector'
import { globalReset } from '../common'

// EVENTS

/** Focus a port editor */
export const focusPortEditor = focusedEditorsDomain.createEvent<FocusPortEditorEvent>()

/** Blur a port editor */
export const blurPortEditor = focusedEditorsDomain.createEvent<BlurPortEditorEvent>()

/** Clear all focused editors */
export const clearAllFocusedEditors = focusedEditorsDomain.createEvent()

// STORES

/** Store for currently focused port editors (keyed by nodeId-portId) */
export const $focusedPortEditors = focusedEditorsDomain.createStore<Record<string, FocusedPortEditor>>({})
  .on(focusPortEditor, (state, { nodeId, portId }) => {
    const editorKey = `${nodeId}-${portId}`
    return {
      ...state,
      [editorKey]: {
        nodeId,
        portId,
        focusedAt: Date.now(),
      },
    }
  })
  .on(blurPortEditor, (state, { nodeId, portId }) => {
    const editorKey = `${nodeId}-${portId}`
    const newState = { ...state }
    delete newState[editorKey]
    return newState
  })
  .reset(clearAllFocusedEditors)
  .reset(globalReset)

/** Store indicating if any port editor is currently focused */
export const $hasAnyFocusedEditor = $focusedPortEditors.map(
  focusedEditors => Object.keys(focusedEditors).length > 0,
)

/** Store containing array of currently focused editors */
export const $focusedEditorsArray = $focusedPortEditors.map(
  focusedEditors => Object.values(focusedEditors),
)

/** Store containing the count of focused editors */
export const $focusedEditorsCount = $focusedEditorsArray.map(
  editors => editors.length,
)

/** Combined state for UI components */
export const $focusedEditorsState = combine({
  focusedEditors: $focusedPortEditors,
  hasAnyFocused: $hasAnyFocusedEditor,
  focusedEditorsArray: $focusedEditorsArray,
  count: $focusedEditorsCount,
})

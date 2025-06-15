/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Represents a focused port editor
 */
export interface FocusedPortEditor {
  /** ID of the node containing the port */
  nodeId: string
  /** ID of the port that has focus */
  portId: string
  /** Timestamp when the editor was focused */
  focusedAt: number
}

/**
 * Events for focused editors management
 */

/** Event to focus a port editor */
export interface FocusPortEditorEvent {
  nodeId: string
  portId: string
}

/** Event to blur a port editor */
export interface BlurPortEditorEvent {
  nodeId: string
  portId: string
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Represents possible node execution statuses
 */
export enum NodeStatus {
  Idle = 'idle',
  Initialized = 'initialized',
  Ready = 'ready',
  Pending = 'pending',
  Executing = 'executing',
  Completed = 'completed',
  Error = 'error',
  Disposed = 'disposed',
}

/**
 * Represents possible validation message types
 */
export enum ValidationMessageType {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

/**
 * Represents possible node execution result statuses
 */
export enum NodeExecutionStatus {
  Completed = 'completed',
  Error = 'error',
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import type { IPortConfig } from '../../port'
import type { JSONValue } from '../../utils/json'
import type { EventContext } from '../implementations'
import type { NodeEvent } from '../events'
import type { NodeExecutionResult } from '../types'
import type { IComplexPortHandler } from './icomplex-port-handler'
import type { ICoreNode } from './icore-node'
import type { IDefaultPortManager } from './idefault-port-manager'
import type { INodeClonable } from './inode-clonable'
import type { INodeEvents } from './inode-events'
import type { INodeUI } from './inode-ui'
import type { INodeVersioning } from './inode-versioning'
import type { IPortBinder } from './iport-binder'
import type { IPortManager } from './iport-manager'
import type { ISerializable } from './iserializable'

/**
 * INodeComposite combines all node-related interfaces into a single composite interface.
 * This interface represents the complete set of capabilities that a node should have.
 */
export interface INodeComposite extends
  ICoreNode,
  IPortManager,
  IPortBinder,
  IComplexPortHandler,
  INodeUI,
  INodeEvents,
  Omit<ISerializable<INodeComposite>, 'deserialize' | 'clone'>,
  INodeVersioning,
  IDefaultPortManager,
  INodeClonable<INodeComposite> {

  /**
   * Initialize the node with port configurations
   * @param portsConfig Optional map of port configurations
   */
  initialize: (portsConfig?: Map<string, IPortConfig>) => void

  /**
   * Deserialize from JSON data
   * @param data The serialized data
   * @returns The deserialized instance
   */
  deserialize: (data: JSONValue) => INodeComposite

  /**
   * Create a deep clone of the node
   * @returns A new node instance with the same state
   */
  clone: () => INodeComposite

  /**
   * Emit an event to all subscribers
   * @param event The event to emit
   */
  emit: <T extends NodeEvent>(event: T) => Promise<void>

  /**
   * Execute the node with default port handling
   * This is a non-abstract method that handles flow control and error handling
   * @param context The execution context
   * @returns The execution result
   */
  executeWithDefaultPorts: (context: ExecutionContext) => Promise<NodeExecutionResult>

  /**
   * Start collecting port updates without emitting events immediately
   * Used for batch operations where multiple ports are updated
   */
  startBatchUpdate: () => void

  /**
   * Commit all collected port updates and emit events
   * @param eventContext Optional context to be added to all emitted events
   */
  commitBatchUpdate: (eventContext?: EventContext) => Promise<void>
}

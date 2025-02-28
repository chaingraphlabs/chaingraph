/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import type { NodeExecutionResult, NodeMetadata, NodeValidationResult } from '../../node/types'
import type { NodeStatus } from '../../node/node-enums'

/**
 * Core node interface defining the essential properties and methods of a node.
 */
export interface ICoreNode {
    /** Unique identifier of the node */
    readonly id: string

    /** Metadata describing the node */
    readonly metadata: NodeMetadata

    /** Current execution status of the node */
    readonly status: NodeStatus

    /**
     * Execute the node with the given context
     * @param context The execution context
     * @returns A promise resolving to the execution result
     */
    execute(context: ExecutionContext): Promise<NodeExecutionResult>

    /**
     * Validate the node configuration
     * @returns A promise resolving to the validation result
     */
    validate(): Promise<NodeValidationResult>

    /**
     * Reset the node to its initial state
     */
    reset(): Promise<void>

    /**
     * Release resources and prepare the node for garbage collection
     */
    dispose(): Promise<void>

    /**
     * Set the node status
     * @param status New status
     * @param emitEvent Whether to emit a status change event
     */
    setStatus(status: NodeStatus, emitEvent?: boolean): void

    /**
     * Set the node metadata
     * @param metadata New metadata
     */
    setMetadata(metadata: NodeMetadata): void
}
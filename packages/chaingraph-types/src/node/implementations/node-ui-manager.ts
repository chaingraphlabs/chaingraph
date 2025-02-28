/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeEvent, NodeEventType } from '../../node/events'
import type { Dimensions, NodeUIMetadata, Position } from '../../node/node-ui'
import type { NodeMetadata } from '../../node/types'
import { NodeEventType as EventType } from '../../node/events'
import { INodeUI, INodeVersioning } from '../interfaces'

/**
 * Implementation of INodeUI interface
 * Handles UI operations for nodes
 */
export class NodeUIManager implements INodeUI {
    constructor(
        private metadata: NodeMetadata,
        private versionManager: INodeVersioning,
        private eventEmitter: { emit<T extends NodeEvent>(event: T): Promise<void> },
        private eventFactory: { createEvent<T extends NodeEventType>(type: T, data: any): any }
    ) { }

    /**
     * Get the node's UI metadata
     * @returns Node UI metadata or undefined if not set
     */
    getUI(): NodeUIMetadata | undefined {
        return this.metadata.ui
    }

    /**
     * Update the node's UI metadata
     * @param ui New UI metadata
     * @param emitEvent Whether to emit a UI change event
     */
    setUI(ui: NodeUIMetadata, emitEvent?: boolean): void {
        if (!this.metadata.ui) {
            this.metadata.ui = ui
        } else {
            this.metadata.ui = { ...this.metadata.ui, ...ui }
        }

        if (!emitEvent) {
            return
        }

        // Update the version
        this.versionManager.incrementVersion()

        this.eventEmitter.emit(this.eventFactory.createEvent(EventType.UIChange, {
            ui: this.metadata.ui,
        }))
    }

    /**
     * Update the node's position
     * @param position New position coordinates
     * @param emitEvent Whether to emit a position change event
     */
    setPosition(position: Position, emitEvent?: boolean): void {
        const oldPosition = this.metadata.ui?.position
        if (!this.metadata.ui) {
            this.metadata.ui = {
                position,
            }
        } else {
            this.metadata.ui = {
                ...this.metadata.ui,
                position,
            }
        }

        if (!emitEvent) {
            return
        }

        // Update the version
        this.versionManager.incrementVersion()

        this.eventEmitter.emit(this.eventFactory.createEvent(EventType.UIPositionChange, {
            oldPosition,
            newPosition: { ...position },
        }))
    }

    /**
     * Update the node's dimensions
     * @param dimensions New dimensions
     * @param emitEvent Whether to emit a dimensions change event
     */
    setDimensions(dimensions: Dimensions, emitEvent?: boolean): void {
        const oldDimensions = this.metadata.ui?.dimensions
        if (!this.metadata.ui) {
            this.metadata.ui = { dimensions }
        } else {
            this.metadata.ui.dimensions = dimensions
        }

        if (!emitEvent) {
            return
        }

        this.versionManager.incrementVersion()
        this.eventEmitter.emit(this.eventFactory.createEvent(EventType.UIDimensionsChange, {
            oldDimensions,
            newDimensions: dimensions,
        }))
    }

    /**
     * Update the node's parent and position
     * @param position New position coordinates
     * @param parentNodeId ID of the parent node or undefined to remove parent
     * @param emitEvent Whether to emit a parent change event
     */
    setNodeParent(position: Position, parentNodeId?: string, emitEvent?: boolean): void {
        const oldParent = this.metadata?.parentNodeId ?? undefined
        const oldPosition = this.metadata?.ui?.position

        this.metadata.parentNodeId = parentNodeId
        if (!this.metadata.ui) {
            this.metadata.ui = { position }
        } else {
            this.metadata.ui.position = position
        }

        if (!emitEvent) {
            return
        }

        this.versionManager.incrementVersion()
        this.eventEmitter.emit(this.eventFactory.createEvent(EventType.ParentChange, {
            oldParentNodeId: oldParent,
            newParentNodeId: parentNodeId,
            oldPosition,
            newPosition: position,
        }))
    }
}
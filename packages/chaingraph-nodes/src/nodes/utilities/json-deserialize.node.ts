/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
    ExecutionContext,
    IPort,
    IPortConfig,
    NodeEvent,
    NodeExecutionResult,
    AnyPort,
    PortConnectedEvent,
    PortDisconnectedEvent,
    PortUpdateEvent,
} from '@badaitech/chaingraph-types'
import {
    BaseNode,
    ExecutionEventEnum,
    Boolean,
    Input,
    Node,
    NodeEventType,
    Output,
    PortAny,
    String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
    type: 'JsonDeserializeNode',
    title: 'JSON Deserializer',
    description: 'Deserializes a JSON string into an object based on the provided schema',
    category: NODE_CATEGORIES.UTILITIES,
    tags: ['json', 'deserialize', 'parse', 'convert', 'object'],
})
class JsonDeserializeNode extends BaseNode {
    @Input()
    @PortAny({
        title: 'Output Schema',
        description: 'Schema for the deserialized object. Connect array or object to use its schema for parsing.',
    })
    outputSchema: any = {}

    @Input()
    @String({
        title: 'JSON String',
        description: 'JSON string to be deserialized',
        ui: {
            isTextArea: true,
        },
    })
    jsonString: string = '{}'

    @Input()
    @Boolean({
        title: 'Ignore Missing Fields',
        description: 'If true, missing fields in the JSON will be set to null instead of throwing an error',
        defaultValue: false,
    })
    ignoreMissingFields: boolean = false

    @Output()
    @PortAny({
        title: 'Deserialized Object',
        description: 'The parsed object according to the schema',
        ui: {
            keyDeletable: false,
            hideEditor: false,
        },
    })
    deserializedObject: any = {}

    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
        throw new Error("Not implemented")
        /**
        try {
            // Parse the JSON string
            let parsedJson: Record<string, any>
            try {
                parsedJson = JSON.parse(this.jsonString)
            } catch (error) {
                throw new Error(`Failed to parse JSON string: ${error}`)
            }

            // Get the output port for deserializedObject and extract its schema
            const outputPort = this.findPortByKey('deserializedObject')
            if (!outputPort) {
                throw new Error('Could not find deserializedObject port')
            }

            const outputPortConfig = outputPort.getConfig()
            const outputPortSchema = outputPortConfig.type === 'any' 
                ? (outputPort as AnyPort).getRawConfig().underlyingType?.schema
                : outputPortConfig.schema

            await this.debugLog(context, `Got schema for output port: : ${JSON.stringify(outputPortSchema, null, 1)}`)

            // Clear previous values
            this.deserializedObject = {}

            // If schema is empty or not defined, return the parsed JSON as is
            if (!outputPortSchema || !outputPortSchema.properties || Object.keys(outputPortSchema.properties).length === 0) {
                this.deserializedObject = parsedJson
                return {}
            }

            // Map properties according to the schema
            for (const [key, propConfig] of Object.entries(outputPortSchema.properties)) {
                if (key in parsedJson) {
                    if (!this.validateType(parsedJson[key], propConfig.type)) {
                        throw new Error(`Type mismatch for field '${key}': expected ${propConfig.type}, got ${typeof parsedJson[key]}`)
                    }
                    this.deserializedObject[key] = parsedJson[key]
                } else if (!this.ignoreMissingFields) {
                    throw new Error(`Field '${key}' is required but missing in the JSON`)
                } else {
                    this.deserializedObject[key] = null
                }
            }

            return {}
        } catch (error) {
            const errorMessage = `Failed to execute JSON Desrializer node: ${error}`
            throw new Error(errorMessage)
        }
        */
    }

    /**
     * Handle node events to maintain port synchronization
     */
    async onEvent(event: NodeEvent): Promise<void> {
        await super.onEvent(event)

        switch (event.type) {
            case NodeEventType.PortConnected:
                await this.handlePortConnected(event as PortConnectedEvent)
                break
            case NodeEventType.PortDisconnected:
                await this.handlePortDisconnected(event as PortDisconnectedEvent)
                break
        }
    }

    /**
     * Handle port connection events to sync schema from target port
     */
    private async handlePortConnected(event: PortConnectedEvent): Promise<void> {
        const targetPort = event.targetPort;
        const sourcePortConfig = event.sourcePort.getConfig();

        if (sourcePortConfig.key === 'outputSchema') {
            await this.syncSchemaToOutput(targetPort);
        }
    }

    /**
     * Handle port disconnection events to sync schema from input port back
     */
    private async handlePortDisconnected(event: PortDisconnectedEvent): Promise<void> {
        const disconnectedPortConfig = event.sourcePort.getConfig();

        if (disconnectedPortConfig.key === 'outputSchema') {
            await this.cleanSchemaToOutput();
        }
    }

    /**
     * Synchronize the schema from outputSchema to deserializedObject
     */
    private async syncSchemaToOutput(targetPort: IPort): Promise<void> {
        try {
            const outputPort = this.findPortByKey('deserializedObject')
            if (!outputPort) {
                throw new Error('Could not find deserializedObject port')
            }

            if (outputPort.getConfig().type !== 'any') {
                throw new Error('Cannot sync schema: deserializedObject port is not an AnyPort')
            }

            const outputAnyPort = outputPort as AnyPort;

            if (targetPort.getConfig().type === 'any') {
                const targetAnyPort = targetPort as AnyPort;
                const underlyingType = targetAnyPort.getRawConfig().underlyingType;

                if (underlyingType) {
                    outputAnyPort.setUnderlyingType(underlyingType);
                }
            } else {
                const targetConfig = targetPort.getConfig();
                outputAnyPort.setUnderlyingType(targetConfig);
            }

            await this.updatePort(outputPort);
            this.deserializedObject = {};

        } catch (error) {
            const errorMessage = `Error synchronizing schema: ${error}`
            throw new Error(errorMessage)
        }
    }

    /**
     * Clean the schema in the deserializedObject output port when input is disconnected
     */
    private async cleanSchemaToOutput(): Promise<void> {
        try {
            const outputPort = this.findPortByKey('deserializedObject')
            if (!outputPort) {
                throw new Error('Could not find deserializedObject port')
            }

            if (outputPort.getConfig().type !== 'any') {
                throw new Error('Cannot sync schema: deserializedObject port is not an AnyPort')
            }

            const outputAnyPort = outputPort as AnyPort;
            outputAnyPort.setUnderlyingType(undefined);
            await this.updatePort(outputPort);

            this.deserializedObject = {};

        } catch (error) {
            const errorMessage = `Error cleaning schema: ${error}`
            throw new Error(errorMessage)
        }
    }

    /**
     * Validate if a value matches the expected type
     */
    private validateType(value: any, expectedType: string): boolean {
        if (value === null || value === undefined) {
            return true // Null/undefined is allowed for any type
        }

        switch (expectedType) {
            case 'string':
                return typeof value === 'string'
            case 'number':
                return typeof value === 'number'
            case 'boolean':
                return typeof value === 'boolean'
            case 'object':
                return typeof value === 'object' && !Array.isArray(value)
            case 'array':
                return Array.isArray(value)
            default:
                return true // Unknown types will pass validation
        }
    }

    /**
     * Send a debug log event to the execution context
     */
    private async debugLog(context: ExecutionContext, message: string): Promise<void> {
        await context.sendEvent({
            index: 0,
            type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
            timestamp: new Date(),
            data: {
                node: this.clone(),
                log: message,
            },
        })
    }
}

export default JsonDeserializeNode
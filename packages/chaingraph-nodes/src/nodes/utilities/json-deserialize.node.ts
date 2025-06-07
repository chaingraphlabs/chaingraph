/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
    AnyPort,
    ExecutionContext,
    ExecutionEvent,
    IPort,
    IPortConfig,
    NodeEvent,
    NodeExecutionResult,
    ObjectPort,
    ObjectPortConfig,
    PortConnectedEvent,
    PortUpdateEvent,
} from '@badaitech/chaingraph-types'
import {
    BaseNode,
    Boolean,
    ExecutionEventEnum,
    findPort,
    Input,
    Node,
    NodeEventType,
    Output,
    PortAny,
    PortObject,
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
    @PortObject({
        title: 'Output Schema',
        description: 'Schema for the deserialized object. Connect an object port to define the structure.',
        isSchemaMutable: true,
        schema: {
            type: 'object',
            properties: {},
        },
        ui: {
            keyDeletable: true,
        }
    })
    outputSchema: Record<string, any> = {}

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
    @PortObject({
        title: 'Deserialized Object',
        description: 'The parsed object according to the schema',
        isSchemaMutable: true,
        schema: {
            type: 'object',
            properties: {},
        },
        ui: {
            keyDeletable: true,
        }
    })
    deserializedObject: Record<string, any> = {}

    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
        try {
            // First, parse the JSON string
            let parsedJson: Record<string, any>
            try {
                parsedJson = JSON.parse(this.jsonString)
            } catch (error) {
                throw new Error(`Failed to parse JSON string: ${error}`)
            }

            // Clear previous values
            this.deserializedObject = {}

            // Get the output port for deserializedObject to extract its schema
            const outputPort = this.findPortByKey('deserializedObject') as ObjectPort | null
            if (!outputPort) {
                throw new Error('Could not find deserializedObject port')
            }

            // Extract the schema from the port configuration
            const portConfig = outputPort.getConfig()
            const schema = portConfig.schema

            // If schema is empty or not defined, return the parsed JSON as is
            if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
                this.deserializedObject = parsedJson
                return {}
            }

            // Map properties according to the schema
            for (const [key, propConfig] of Object.entries(schema.properties)) {
                if (key in parsedJson) {
                    // Property exists in the JSON, check if types match
                    if (!this.validateType(parsedJson[key], propConfig.type)) {
                        throw new Error(`Type mismatch for field '${key}': expected ${propConfig.type}, got ${typeof parsedJson[key]}`)
                    }
                    this.deserializedObject[key] = parsedJson[key]
                } else if (!this.ignoreMissingFields) {
                    // Property doesn't exist and we're not ignoring missing fields
                    throw new Error(`Field '${key}' is required but missing in the JSON`)
                } else {
                    // Property doesn't exist but we're ignoring missing fields
                    this.deserializedObject[key] = null
                }
            }

            await this.debugLog(context, `Successfully deserialized JSON to object: ${JSON.stringify(this.deserializedObject, null, 2)}`)

            return {}
        } catch (error) {
            const errorMessage = `Failed to deserialize JSON: ${error}`
            await this.debugLog(context, `ERROR: ${errorMessage}`)
            throw new Error(errorMessage)
        }
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
            case NodeEventType.PortUpdate:
                await this.handlePortUpdate(event as PortUpdateEvent)
                break
        }
    }

    /**
     * Handle port update events
     */
    private async handlePortUpdate(event: PortUpdateEvent): Promise<void> {
        // Check if the updated port is our outputSchema port
        if (event.port.getConfig().key === 'outputSchema') {
            // Sync the schema to the output port
            await this.syncSchemaToOutput(event.port as ObjectPort)
        }
    }

    /**
     * Handle port connection events to sync schema from input to output
     */
    private async handlePortConnected(event: PortConnectedEvent): Promise<void> {
        // Only process connections to our own inputs
        if (event.targetNode.id !== this.id) {
            return
        }

        const targetPort = event.targetPort
        const targetPortConfig = targetPort.getConfig()

        // Only interested in connections to the outputSchema port
        if (targetPortConfig.key !== 'outputSchema') {
            return
        }

        try {
            // Get the connected source port
            const sourcePort = event.sourcePort

            // Check if it's an object port
            if (sourcePort.getConfig().type !== 'object') {
                return
            }

            // Get the outputSchema port
            const outputSchemaPort = this.findPortByKey('outputSchema') as ObjectPort | null
            if (!outputSchemaPort) {
                return
            }

            // Sync the schema from the source port to our output port
            await this.syncSchemaToOutput(outputSchemaPort)

        } catch (error) {
            console.error('Error handling port connection:', error)
            await this.debugLog({ sendEvent: async (e) => { console.log(e) } } as any,
                `Error handling port connection: ${error}`)
        }
    }

    /**
     * Synchronize the schema from outputSchema to deserializedObject
     */
    private async syncSchemaToOutput(sourcePort: ObjectPort): Promise<void> {
        try {
            // Get the source schema
            const sourceSchema = sourcePort.getConfig().schema
            if (!sourceSchema || !sourceSchema.properties) {
                return
            }

            // Get the deserializedObject port
            const deserializedObjectPort = this.findPortByKey('deserializedObject') as ObjectPort | null
            if (!deserializedObjectPort) {
                return
            }

            // Clear existing properties in the deserializedObject port
            const currentSchema = deserializedObjectPort.getConfig().schema
            const currentProperties = currentSchema.properties || {}
            for (const key of Object.keys(currentProperties)) {
                this.removeObjectProperty(deserializedObjectPort as IPort, key)
            }

            // Create output ports matching the schema properties
            for (const [key, propConfig] of Object.entries(sourceSchema.properties)) {
                // Create a port configuration for this property
                const newPortConfig: IPortConfig = {
                    ...propConfig,
                    id: `${this.id}_output_${key}`,
                    key: key,
                    nodeId: this.id,
                    parentId: deserializedObjectPort.id,
                    direction: 'output',
                    ui: {
                        ...(propConfig.ui || {}),
                        keyDeletable: true,
                    },
                }

                // Add the property to the deserializedObject port
                await this.addObjectProperty(deserializedObjectPort as IPort, key, newPortConfig)
            }

            await this.debugLog({ sendEvent: async (e) => { console.log(e) } } as any,
                `Updated deserializedObject schema with properties: ${Object.keys(sourceSchema.properties).join(', ')}`)
        } catch (error) {
            console.error('Error synchronizing schema:', error)
            await this.debugLog({ sendEvent: async (e) => { console.log(e) } } as any,
                `Error synchronizing schema: ${error}`)
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
        const event: ExecutionEvent = {
            index: 0,
            type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
            timestamp: new Date(),
            data: {
                node: this.clone(),
                log: message,
            },
        }

        await context.sendEvent(event)
    }
}

export default JsonDeserializeNode
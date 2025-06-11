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
    Number as NumberDecorator,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

const supportedTypes = ['number', 'boolean', 'string', 'object', 'array'];
const DEFAULT_MAX_DEPTH = 3;

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
    outputSchema: any

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
        description: 'If true, missing fields in the JSON objects will be set to null instead of throwing an error',
        defaultValue: false,
    })
    ignoreMissingFields: boolean = false

    @Input()
    @NumberDecorator({
        title: 'Schema Depth',
        description: 'Current depth of the schema structure (internal use). Effective for objects and arrays.',
        defaultValue: 0,
        //ui: {
        //    hidden: true,
        //},
    })
    schemaDepth: number = 0

    @Output()
    @PortAny({
        title: 'Deserialized Value',
        description: 'The parsed object according to the schema',
        ui: {
            hideEditor: true,
        }
    })
    deserializedObject: any = null

    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
        try {
            let parsedJson: any;

            if (this.jsonString.trim() === '') {
                parsedJson = null;
            } else {
                try {
                    parsedJson = JSON.parse(this.jsonString);
                } catch (error) {
                    throw new Error(`Failed to parse JSON string: ${error}`);
                }
            }

            const outputPort = this.findPortByKey('deserializedObject')
            const outputAnyPort = outputPort as AnyPort;

            if (!outputPort || !outputAnyPort) {
                throw new Error(`Cannot locate deserializedObject port`);
            }

            await this.assignValue(
                parsedJson,
                outputAnyPort,
                this.ignoreMissingFields,
                Math.min(this.schemaDepth, DEFAULT_MAX_DEPTH)
            );

            return {};
        } catch (error) {
            throw new Error(`Failed to execute JSON Deserializer node: ${error}`);
        }
    }

    /**
     * Calculate the maximum depth of the schema
     */
    private calculateSchemaDepth(schema: any, currentDepth: number = 0): number {
        if (!schema || currentDepth > DEFAULT_MAX_DEPTH) {
            return currentDepth;
        }

        const schemaType = schema.type;

        // For primitive types, return current depth
        if (['string', 'number', 'boolean'].includes(schemaType)) {
            return currentDepth + 1;
        }

        // For arrays, calculate depth from item schema
        if (schemaType === 'array' && schema.itemConfig) {
            return this.calculateSchemaDepth(schema.itemConfig, currentDepth + 1);
        }

        // For objects, find the deepest property
        if (schemaType === 'object' && schema.schema && schema.schema.properties) {
            let maxPropertyDepth = currentDepth + 1;

            for (const propSchema of Object.values(schema.schema.properties)) {
                const propertyDepth = this.calculateSchemaDepth(propSchema, currentDepth + 1);
                maxPropertyDepth = Math.max(maxPropertyDepth, propertyDepth);
            }

            return maxPropertyDepth;
        }

        return currentDepth + 1;
    }

    /**
     * Recursively deserialize values according to the schema
     */
    private async assignValue(
        value: any,
        port: AnyPort,
        ignoreMissingFields: boolean,
        depth: number
    ): Promise<void> {
        const schema = port.getRawConfig().underlyingType

        if (!schema) {
            throw new Error(`No schema provided`);
        }

        const schemaType = schema.type;

        if (value === null || value === undefined) {
            port.setValue(null);
        }

        const valueType = typeof value
        if (valueType === schemaType) {
            port.setValue(value);
        } else {
            throw new Error(`Types mismatch: provided value of ${valueType} type cannot be assigned to ${schemaType} port`);
        }

        /**
        // Handle primitive types
        if (['string', 'number', 'boolean'].includes(schemaType)) {
            if (value === null || value === undefined) {
                port.setValue(null);
            }

            const valueType = typeof value
            if (valueType === schemaType) {
                port.setValue(value);
            } else {
                throw new Error(`Types mismatch: provided value of ${valueType} type cannot be assigned to ${schemaType} port`);
            }
        }
    
        /**
        // Handle arrays
        if (schemaType === 'array') {
            if (value === null || value === undefined) {
                port.setValue(null);
            }

            const valueType = typeof value
            if (!Array.isArray(value)) {
                throw new Error(`Types mismatch: provided value of ${valueType} type cannot be assigned to array port`);
            }

            const itemSchema = schema.itemConfig;
            if (!itemSchema) {
                port.setValue(value);
            } 
            else if (valueType === itemSchema.type) {
                if (valueType === 'object' || 'array') {
                    const currentType = valueType
                    let remainingDepth: number = depth - 1

                    do {
                        if (remainingDepth === 1) {

                        }

                        remainingDepth--
                    } while (remainingDepth > 0)
                } else {
                    port.setValue(value);
                }
            }
            else {
                throw new Error(`Types mismatch: provided array's items don't match array schema`);
            }

            const result: any[] = [];
            for (const item of value) {
                const deserializedItem = this.deserializeValue(
                    item,
                    itemSchema,
                    ignoreMissingFields,
                    currentDepth + 1
                );
                result.push(deserializedItem);
            }
            return result;
        }
        /**
        // Handle objects
        if (schemaType === 'object') {
            if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
                if (ignoreMissingFields) {
                    return {}; // Return empty object if input is not an object and we're ignoring errors
                }
                throw new Error(`Expected object but got ${typeof value}`);
            }

            const result: Record<string, any> = {};

            // If schema has no properties, pass through all properties from input
            if (!schema.schema || !schema.schema.properties || Object.keys(schema.schema.properties).length === 0) {
                return value;
            }

            // Process each property according to schema
            for (const [key, propSchema] of Object.entries(schema.schema.properties)) {
                if (key in value) {
                    result[key] = this.deserializeValue(
                        value[key],
                        propSchema,
                        ignoreMissingFields,
                        currentDepth + 1
                    );
                } else if (!ignoreMissingFields) {
                    throw new Error(`Required field '${key}' is missing in the JSON`);
                } else {
                    result[key] = null; // Set missing field to null when ignoring missing fields
                }
            }

            // Add additional properties not in schema if they exist in the input
            for (const key of Object.keys(value)) {
                if (!(key in result)) {
                    result[key] = value[key];
                }
            }

            return result;
        }
         */
        // For unsupported types or when type is not specified, return as is
    }

    /**
     * Handle node events to maintain port synchronization
     */
    async onEvent(event: NodeEvent): Promise<void> {
        await super.onEvent(event)

        if (event.type === NodeEventType.PortUpdate) {
            await this.handleUpdate(event as PortUpdateEvent)
        }

        // !!! To depecate after disconnections fix
        if (event.type === NodeEventType.PortDisconnected) {
            await this.handleDisconnection(event as PortDisconnectedEvent)
        }
    }

    /**
     * !!! To depecate after disconnections fix
     */
    private async handleDisconnection(event: PortDisconnectedEvent): Promise<void> {
        const inputPortConfig = event.sourcePort.getConfig();
        if (
            !inputPortConfig
            || inputPortConfig.key !== 'outputSchema'
            || inputPortConfig.direction !== 'input'
            || inputPortConfig.parentId
        ) {
            return
        }

        const inputAnyPort = event.sourcePort as AnyPort
        const outputPort = this.findPortByKey('deserializedObject')
        const outputAnyPort = outputPort as AnyPort;

        if (!inputAnyPort || !outputPort || !outputAnyPort) {
            return
        }

        try {
            await inputAnyPort.setUnderlyingType(undefined)
            await this.updatePort(inputAnyPort as IPort);

            await outputAnyPort.setUnderlyingType(undefined)
            await this.updatePort(outputAnyPort as IPort);

            this.schemaDepth = 0
        } catch (error) {
            throw new Error(`Error synchronizing schema: ${error}`);
        }
    }

    /**
     * Handle input port update events to sync schema to the output port
     */
    private async handleUpdate(event: PortUpdateEvent): Promise<void> {
        const inputPortConfig = event.port.getConfig();
        if (
            !inputPortConfig
            || inputPortConfig.key !== 'outputSchema'
            || inputPortConfig.direction !== 'input'
            || inputPortConfig.parentId
        ) {
            return
        }

        const inputPort = event.port as AnyPort
        const inputPortRawConfig = inputPort.getRawConfig()

        const outputPort = this.findPortByKey('deserializedObject')
        const outputAnyPort = outputPort as AnyPort;

        if (!outputPort || !outputAnyPort) {
            return
        }

        if (!inputPortRawConfig.underlyingType || !supportedTypes.includes(inputPortRawConfig.underlyingType.type)) {
            return
        }

        try {
            outputAnyPort.setUnderlyingType(inputPortRawConfig.underlyingType);
            this.schemaDepth = this.calculateSchemaDepth(outputAnyPort);
            await this.updatePort(outputAnyPort as IPort);
        } catch (error) {
            throw new Error(`Error synchronizing schema: ${error}`);
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
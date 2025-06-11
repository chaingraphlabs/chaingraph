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

const nonSupportedTypes = ['any', 'stream'];
const DEFAULT_MAX_DEPTH = 10;

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
        description: 'If true, missing fields in the JSON will be set to null instead of throwing an error',
        defaultValue: false,
    })
    ignoreMissingFields: boolean = false

    @Input()
    @NumberDecorator({
        title: 'Schema Depth',
        description: 'Current depth of the schema structure (internal use)',
        defaultValue: 0,
        ui: {
            hidden: true,
        },
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
            // Parse the JSON string
            let parsedJson: any;
            try {
                // Handle single values in JSON like numbers or strings without quotes
                if (this.jsonString.trim() === '') {
                    parsedJson = null;
                } else {
                    try {
                        parsedJson = JSON.parse(this.jsonString);
                    } catch (e) {
                        // Try to interpret as a primitive value if not valid JSON
                        if (this.jsonString === 'true') parsedJson = true;
                        else if (this.jsonString === 'false') parsedJson = false;
                        else if (!isNaN(Number(this.jsonString))) parsedJson = Number(this.jsonString);
                        else parsedJson = this.jsonString; // Treat as string if no other type matches
                    }
                }
            } catch (e) {
                throw new Error(`Failed to parse JSON string: ${e}`);
            }

            await this.debugLog(context, `Parsed JSON: ${JSON.stringify(parsedJson, null, 2)}`);

            // Get the output port for deserializedObject and extract its schema
            const outputPort = this.findPortByKey('deserializedObject') as AnyPort | null;
            if (!outputPort) {
                throw new Error('Could not find deserializedObject port');
            }

            const underlyingType = outputPort.getRawConfig().underlyingType;

            await this.debugLog(context, `Underlying type: ${JSON.stringify(underlyingType, null, 2)}`);
            await this.debugLog(context, `Schema depth: ${this.schemaDepth}`);

            // If no schema is provided, return the parsed JSON as is
            if (!underlyingType) {
                this.deserializedObject = parsedJson;
                return {};
            }

            // Calculate schema depth if not already set
            if (this.schemaDepth === 0) {
                this.schemaDepth = this.calculateSchemaDepth(underlyingType);
                await this.debugLog(context, `Calculated schema depth: ${this.schemaDepth}`);
            }

            // Deserialize based on the schema
            this.deserializedObject = this.deserializeValue(
                parsedJson,
                underlyingType,
                this.ignoreMissingFields
            );

            await this.debugLog(context, `Deserialized object: ${JSON.stringify(this.deserializedObject, null, 2)}`);

            return {};
        } catch (e) {
            throw new Error(`Failed to execute JSON Deserializer node: ${e}`);
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
    private deserializeValue(
        value: any,
        schema: any,
        ignoreMissingFields: boolean,
        currentDepth: number = 0
    ): any {
        // Prevent processing beyond max depth
        if (currentDepth >= DEFAULT_MAX_DEPTH) {
            return value;
        }

        if (!schema) {
            return value; // No schema to validate against
        }

        const schemaType = schema.type;

        // Handle primitive types
        if (['string', 'number', 'boolean'].includes(schemaType)) {
            if (value === null || value === undefined) {
                return null;
            }

            // Type conversion/validation
            if (schemaType === 'string') {
                return String(value);
            } else if (schemaType === 'number') {
                const num = Number(value);
                if (isNaN(num)) {
                    throw new Error(`Cannot convert "${value}" to number`);
                }
                return num;
            } else if (schemaType === 'boolean') {
                if (typeof value === 'boolean') return value;
                if (value === 'true') return true;
                if (value === 'false') return false;
                if (typeof value === 'number') return value !== 0;
                throw new Error(`Cannot convert "${value}" to boolean`);
            }
            return value;
        }

        // Handle arrays
        if (schemaType === 'array') {
            if (!Array.isArray(value)) {
                // Try to convert single value to array if possible
                if (value !== null && value !== undefined) {
                    value = [value];
                } else {
                    return [];
                }
            }

            const itemSchema = schema.itemConfig;
            if (!itemSchema) {
                return value; // No schema for array items
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

        // For unsupported types or when type is not specified, return as is
        return value;
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

        if (
            !sourcePortConfig
            || sourcePortConfig.key !== 'outputSchema'
            || sourcePortConfig.direction !== 'input'
            || sourcePortConfig.parentId
        ) {
            return
        }

        const outputPort = this.findPortByKey('deserializedObject')
        const outputAnyPort = outputPort as AnyPort;

        if (!outputPort || !outputAnyPort || outputAnyPort.getConfig().type !== 'any') {
            return
        }

        const targetPortConfig = targetPort.getConfig()

        if (!targetPortConfig || nonSupportedTypes.includes(targetPortConfig.type)) {
            throw new Error("The port you are trying to connect cannot be used as schema")
        }

        try {
            outputAnyPort.setUnderlyingType(targetPortConfig);

            // Calculate and store schema depth
            this.schemaDepth = this.calculateSchemaDepth(targetPortConfig);

            await this.updatePort(outputAnyPort as IPort);
        } catch (e) {
            throw new Error(`Error synchronizing schema: ${e}`);
        }
    }

    /**
     * Handle port disconnection events to sync schema from input port back
     */
    private async handlePortDisconnected(event: PortDisconnectedEvent): Promise<void> {
        const sourcePortConfig = event.sourcePort.getConfig();

        if (
            !sourcePortConfig
            || sourcePortConfig.key !== 'outputSchema'
            || sourcePortConfig.direction !== 'input'
            || sourcePortConfig.parentId
        ) {
            return
        }

        const outputPort = this.findPortByKey('deserializedObject')
        const outputAnyPort = outputPort as AnyPort;

        if (!outputPort || !outputAnyPort || outputAnyPort.getConfig().type !== 'any') {
            return
        }

        outputAnyPort.setUnderlyingType(undefined);
        this.schemaDepth = 0;
        await this.updatePort(outputAnyPort as IPort);
        this.deserializedObject = null;
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
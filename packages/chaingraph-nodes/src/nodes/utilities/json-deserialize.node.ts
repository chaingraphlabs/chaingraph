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

const SUPPORTED_TYPES = ['number', 'boolean', 'string', 'object', 'array'];
const DEFAULT_MAX_DEPTH = 6;

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
        description: 'If true, missing fields in JSON objects will be set to null instead of throwing an error',
        defaultValue: false,
    })
    ignoreMissingFields: boolean = false

    @Input()
    @NumberDecorator({
        title: 'Max Depth',
        description: `Maximum depth of filtering output by the schema. Effective for objects and arrays. Maximum of ${DEFAULT_MAX_DEPTH} will be used if 0 is provided.`,
        defaultValue: 0,
    })
    maxDepth: number = 0

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

            const outputPort = this.findPortByKey('deserializedObject') as AnyPort;

            if (!outputPort) {
                throw new Error(`Cannot locate deserializedObject port`);
            }

            const schema = outputPort.getRawConfig().underlyingType

            if (!schema) {
                throw new Error(`Output port has no schema assigned. Make sure that you've provided a valid schema of one of these types: ${SUPPORTED_TYPES.join(', ')}.`);
            }

            try {
                const processedValue = this.filterOutputBySchema(
                    parsedJson,
                    schema,
                    this.ignoreMissingFields,
                    this.maxDepth === 0 ? DEFAULT_MAX_DEPTH : this.maxDepth
                )
                outputPort.setValue(processedValue);
            } catch (error) {
                throw new Error(`Error applying value to provided schema: ${error}`);
            }
            return {};
        } catch (error) {
            throw new Error(`Failed to execute: ${error}`);
        }
    }

    /**
     * Process data strictly according to schema at a specific depth
     * This ensures we only include the parts of the object defined in the schema
     */
    private filterOutputBySchema(
        value: any,
        schema: IPortConfig,
        ignoreMissingFields: boolean,
        depthLeft: number
    ): Object | Array<any> | Number | string | number | null {
        if (value === null || value === undefined) {
            return null;
        }

        const schemaType = schema.type;

        if (schemaType === 'any') {
            return value;
        }

        if (!SUPPORTED_TYPES.includes(schemaType)) {
            throw new Error(`Type ${schemaType} is not supported. Supported types are: ${SUPPORTED_TYPES.join(', ')}.`)
        }

        // For primitive types, just validate and return
        if (['string', 'number', 'boolean'].includes(schemaType)) {
            const valueType = typeof value;
            if (valueType === schemaType) {
                return value;
            } else {
                throw new Error(`Types mismatch: expected ${schemaType} but got ${valueType}`);
            }
        }

        // Handle arrays
        if (schemaType === 'array') {
            if (!Array.isArray(value)) {
                throw new Error(`Types mismatch: Expected array but got ${typeof value}`);
            }

            if (!schema.itemConfig || depthLeft <= 0) {
                return value;
            }

            const result: any[] = [];
            const itemSchema = schema.itemConfig;

            for (const item of value) {
                try {
                    // For 'any' type items, add them directly without validation
                    if (itemSchema.type === 'any') {
                        result.push(item);
                    }
                    // For complex types, process with reduced depth
                    else if (itemSchema.type === 'object' || itemSchema.type === 'array') {
                        const processedItem = this.filterOutputBySchema(
                            item,
                            itemSchema,
                            ignoreMissingFields,
                            depthLeft - 1
                        );
                        result.push(processedItem);
                    }
                    // For primitive types, just validate the type
                    else if (['string', 'number', 'boolean'].includes(itemSchema.type)) {
                        const itemType = typeof item;
                        if (itemType === itemSchema.type) {
                            // Direct value assignment for primitive types
                            result.push(item);
                        } else if (item === null || item === undefined) {
                            result.push(null);
                        } else if (ignoreMissingFields) {
                            result.push(null);
                        } else {
                            throw new Error(`Array item type mismatch: expected ${itemSchema.type} but got ${itemType}`);
                        }
                    } else {
                        // Unsupported item type
                        if (ignoreMissingFields) {
                            result.push(null);
                        } else {
                            throw new Error(`Unsupported array item type: ${itemSchema.type}`);
                        }
                    }
                } catch (error) {
                    if (ignoreMissingFields) {
                        result.push(null);
                    } else {
                        throw error;
                    }
                }
            }
            return result;
        }

        // Handle objects
        if (schemaType === 'object') {
            if (typeof value !== 'object' || Array.isArray(value)) {
                throw new Error(`Expected object but got ${Array.isArray(value) ? 'array' : typeof value}`);
            }

            // If depth is exhausted or no schema properties, return the original object
            if (depthLeft <= 0 || !schema.schema || !schema.schema.properties) {
                return value;
            }

            const result: any = {};

            // Only include properties defined in the schema
            for (const [key, propSchema] of Object.entries(schema.schema.properties)) {
                const typedPropSchema = propSchema as IPortConfig;

                if (key in value) {
                    try {
                        // Process each property with reduced depth
                        result[key] = this.filterOutputBySchema(
                            value[key],
                            typedPropSchema,
                            ignoreMissingFields,
                            depthLeft - 1
                        );
                    } catch (error) {
                        if (ignoreMissingFields) {
                            result[key] = null;
                        } else {
                            throw error;
                        }
                    }
                } else if (!ignoreMissingFields) {
                    throw new Error(`Required field '${key}' is missing in the input data`);
                } else {
                    result[key] = null;
                }
            }

            return result;
        }

        // Unsupported type - return original value
        return value;
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

        if (!inputPortRawConfig.underlyingType || !SUPPORTED_TYPES.includes(inputPortRawConfig.underlyingType.type)) {
            return
        }

        try {
            outputAnyPort.setUnderlyingType(inputPortRawConfig.underlyingType);
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
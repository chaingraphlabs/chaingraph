/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArrayPortConfig,
  EnumPortConfig,
  ExecutionContext,
  INode,
  IObjectSchema,
  IPort,
  IPortConfig,
  NodeExecutionResult,
  ObjectPort,
  ObjectPortConfig,
  StreamPortConfig,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  ExecutionEventEnum,
  ExecutionEventImpl,
  MultiChannel,
  Node,
  ObjectSchemaCopyTo,
  Output,
  Passthrough,
  PortBoolean,
  PortEnumFromNative,
  PortNumber,
  PortObject,
  PortStream,
  PortString,
  PortVisibility,
} from '@badaitech/chaingraph-types'
import { GoogleGenAI, type Part } from '@google/genai'
import { NODE_CATEGORIES } from '../../../categories'
import {
  GeminiGenerationConfig,
  GeminiThinkingLevel,
  isGemini3Model,
  isGemini25Model,
  supportsThinking,
} from './gemini-types'

const GEMINI_MAX_RETRIES = 3

/**
 * Gemini Structured Output Node
 *
 * This node provides native Gemini structured output using the @google/genai SDK.
 * It uses JSON mode with responseJsonSchema for guaranteed structured output.
 *
 * Key features:
 * - Direct JSON Schema output using responseJsonSchema (supports additionalProperties)
 * - Empty object schemas allowed via additionalProperties: true
 * - System instructions support
 * - Gemini 3/2.5 thinking/reasoning with thought streaming output
 * - Retry logic for robustness
 * - Text-only (focused use case)
 */
@Node({
  type: 'GeminiStructuredOutputNode',
  title: 'Gemini Structured Output',
  description: 'Call Gemini with structured JSON output based on a defined schema',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'gemini', 'structured', 'json', 'schema', 'output'],
})
export class GeminiStructuredOutputNode extends BaseNode {
  // Track stream fields for converting array responses back to streams
  private streamFields: Map<string, StreamPortConfig> = new Map()

  // ============================================================================
  // Configuration
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Configuration',
    description: 'Model and generation settings',
    schema: GeminiGenerationConfig,
    required: true,
  })
  config: GeminiGenerationConfig = new GeminiGenerationConfig()

  // ============================================================================
  // Content Inputs
  // ============================================================================

  @Passthrough()
  @PortString({
    title: 'Prompt',
    description: 'Text prompt for the model',
    ui: {
      isTextArea: true,
    },
    defaultValue: '',
  })
  prompt: string = ''

  @Passthrough()
  @PortString({
    title: 'System Instructions',
    description: 'System-level instructions for the model',
    ui: {
      isTextArea: true,
    },
    defaultValue: '',
  })
  systemInstruction: string = ''

  // ============================================================================
  // Output Schema (mirrors to output)
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Output Schema',
    description: 'Define the JSON structure. Connect an object port or define properties manually.',
    schema: { properties: {} },
    isSchemaMutable: true,
    ui: {
      keyDeletable: true,
      hideEditor: false,
    },
  })
  @ObjectSchemaCopyTo((port: IPort): boolean => {
    return port.getConfig().key === 'structuredResponse' && !port.getConfig().parentId
  })
  outputSchema: Record<string, any> = {}

  // ============================================================================
  // Thinking / Reasoning (Model-specific)
  // ============================================================================

  @Passthrough()
  @PortVisibility({
    showIf: (node: INode) => isGemini3Model((node as GeminiStructuredOutputNode).config.model),
  })
  @PortEnumFromNative(GeminiThinkingLevel, {
    title: 'Thinking Level',
    description: 'Gemini 3 reasoning depth (low = faster, high = deeper)',
    defaultValue: GeminiThinkingLevel.High,
  })
  thinkingLevel: GeminiThinkingLevel = GeminiThinkingLevel.High

  @Passthrough()
  @PortVisibility({
    showIf: (node: INode) => isGemini25Model((node as GeminiStructuredOutputNode).config.model),
  })
  @PortNumber({
    title: 'Thinking Budget',
    description: 'Token budget for reasoning (0 = disable, -1 = dynamic, max 32768)',
    min: -1,
    max: 32768,
    defaultValue: -1,
  })
  thinkingBudget: number = -1

  @Passthrough()
  @PortVisibility({
    showIf: (node: INode) => supportsThinking((node as GeminiStructuredOutputNode).config.model),
  })
  @PortBoolean({
    title: 'Include Thoughts',
    description: 'Include reasoning process in structured output',
    defaultValue: false,
  })
  includeThoughts: boolean = false

  // ============================================================================
  // Output
  // ============================================================================

  @Output()
  @PortObject({
    title: 'Structured Response',
    description: 'Parsed JSON output from Gemini',
    isSchemaMutable: false,
    schema: { type: 'object', properties: {} },
    ui: {
      keyDeletable: false,
      hideEditor: false,
      hidePropertyEditor: true,
    },
  })
  structuredResponse: Record<string, any> = {}

  @Output()
  @PortStream({
    title: 'Thoughts',
    description: 'Streaming output of model reasoning/thinking process (when thinking is enabled)',
    itemConfig: { type: 'string' },
  })
  thoughts: MultiChannel<string> = new MultiChannel()

  // ============================================================================
  // Execute Method
  // ============================================================================

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Clear previous stream tracking
    this.streamFields.clear()

    // Validate inputs
    if (!this.config.apiKey) {
      throw new Error('API Key is required')
    }

    if (!this.prompt) {
      throw new Error('Prompt is required')
    }

    // Get the output schema from port
    const outputPort = this.findPortByKey('structuredResponse') as ObjectPort
    const portConfig = outputPort?.getConfig()
    const schema = portConfig?.schema

    if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
      throw new Error('Output Schema must have at least one property defined')
    }

    // Decrypt API key
    const { apiKey } = await this.config.apiKey.decrypt(context)
    const genAI = new GoogleGenAI({ apiKey })

    // Convert port schema to JSON Schema (track streams for later conversion)
    const jsonSchema = this.convertPortSchemaToJsonSchema(schema, true)

    // Build generation config
    const generationConfig: Record<string, any> = {
      temperature: this.config.temperature,
      maxOutputTokens: this.config.maxOutputTokens,
      topP: this.config.topP,
      topK: this.config.topK,
      responseMimeType: 'application/json',
      responseJsonSchema: jsonSchema,  // Use full JSON Schema (supports additionalProperties)
      abortSignal: context.abortSignal,
    }

    // System instruction (optional)
    if (this.systemInstruction?.trim()) {
      generationConfig.systemInstruction = this.systemInstruction
    }

    // Thinking config (model-specific)
    if (isGemini3Model(this.config.model)) {
      generationConfig.thinkingConfig = {
        thinkingLevel: this.thinkingLevel,
        includeThoughts: this.includeThoughts,
      }
    } else if (isGemini25Model(this.config.model)) {
      generationConfig.thinkingConfig = {
        thinkingBudget: this.thinkingBudget,
        includeThoughts: this.includeThoughts,
      }
    }

    // Execute with retry logic
    const { parsed, thoughts } = await this.generateStructuredResponseWithRetries(
      genAI,
      generationConfig,
      context,
    )

    // Stream thoughts if any were collected
    this.thoughts = new MultiChannel<string>()
    if (thoughts.length > 0) {
      for (const thought of thoughts) {
        this.thoughts.send(thought)
      }
    }
    this.thoughts.close()

    // Set the structured response, converting arrays to streams where needed
    for (const [key, value] of Object.entries(parsed)) {
      const streamConfig = this.streamFields.get(key)

      if (streamConfig && Array.isArray(value)) {
        // Convert array to stream
        const channel = new MultiChannel<any>()
        channel.sendBatch(value)
        channel.close()
        this.structuredResponse[key] = channel
      } else {
        this.structuredResponse[key] = value
      }
    }

    return {}
  }

  // ============================================================================
  // Retry Logic
  // ============================================================================

  private async generateStructuredResponseWithRetries(
    genAI: GoogleGenAI,
    config: Record<string, any>,
    context: ExecutionContext,
  ): Promise<{ parsed: Record<string, any>, thoughts: string[] }> {
    for (let attempt = 0; attempt < GEMINI_MAX_RETRIES; attempt++) {
      try {
        await this.debugLog(context, `Attempt ${attempt + 1}/${GEMINI_MAX_RETRIES}`)

        const response = await genAI.models.generateContent({
          model: this.config.model,
          contents: [{
            role: 'user',
            parts: [{ text: this.prompt }],
          }],
          config,
        })

        // debug json response.candidates:
        await this.debugLog(context, `Model Response: ${JSON.stringify(response, null, 2)}`)

        // Extract response text, handling thought parts correctly
        const parts: Part[] = response.candidates?.[0]?.content?.parts || []
        let resultText = ''
        const thoughtTexts: string[] = []

        for (const part of parts) {
          if (part.thought && part.text) {
            // Thought part - collect for streaming output
            thoughtTexts.push(part.text)
          } else if (part.text) {
            // Regular content part - this contains the JSON
            resultText += part.text
          }
        }

        if (!resultText) {
          throw new Error('No response content from model (only thought parts received or empty response)')
        }

        // Parse JSON
        const parsed = JSON.parse(resultText)

        await this.debugLog(context, `Success: ${JSON.stringify(parsed, null, 2)}`)

        return { parsed, thoughts: thoughtTexts }
      } catch (error: any) {
        const errorMsg = error?.message || String(error)

        if (attempt >= GEMINI_MAX_RETRIES - 1) {
          // Last attempt failed
          await this.debugLog(context, `All retries failed: ${errorMsg}`)
          throw new Error(`Failed after ${GEMINI_MAX_RETRIES} attempts: ${errorMsg}`)
        } else {
          // Retry
          await this.debugLog(context, `Attempt ${attempt + 1} failed: ${errorMsg}, retrying...`)
        }
      }
    }

    // Shouldn't reach here
    throw new Error('Maximum retries exceeded')
  }

  // ============================================================================
  // Schema Conversion Helpers
  // ============================================================================

  /**
   * Convert ChainGraph port schema to JSON Schema format
   * @param portSchema The port schema to convert
   * @param trackStreams If true, track stream fields for later array→stream conversion
   */
  private convertPortSchemaToJsonSchema(
    portSchema: IObjectSchema,
    trackStreams: boolean = false,
  ): Record<string, any> {
    // Handle empty or missing properties - allow any properties
    if (!portSchema.properties || Object.keys(portSchema.properties).length === 0) {
      return {
        type: 'object',
        additionalProperties: true,
      }
    }

    const properties: Record<string, any> = {}
    const required: string[] = []

    for (const [key, propConfig] of Object.entries(portSchema.properties)) {
      const config = propConfig as IPortConfig

      // Track stream fields for later conversion (only at top level)
      if (trackStreams && config.type === 'stream') {
        this.streamFields.set(key, config as StreamPortConfig)
      }

      const propSchema = this.convertPropertyToJsonSchema(config)
      // Filter out null schemas (unsupported types like secret)
      if (propSchema !== null) {
        properties[key] = propSchema
        if (config.required) {
          required.push(key)
        }
      }
    }

    // If all properties were filtered out, allow any properties
    if (Object.keys(properties).length === 0) {
      return {
        type: 'object',
        additionalProperties: true,
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    }
  }

  /**
   * Convert a single property config to JSON Schema
   * Returns null for unsupported types (stream, secret) to skip them
   */
  private convertPropertyToJsonSchema(config: IPortConfig): Record<string, any> | null {
    const schema: Record<string, any> = {}

    if (config.description) {
      schema.description = config.description
    }

    switch (config.type) {
      case 'string':
        schema.type = 'string'
        break
      case 'number':
        schema.type = 'number'
        break
      case 'boolean':
        schema.type = 'boolean'
        break
      case 'array':
        schema.type = 'array'
        schema.items = this.convertArrayItemToJsonSchema(config as ArrayPortConfig)
        break
      case 'object': {
        const objConfig = config as ObjectPortConfig
        // Only recurse if there are actual properties defined
        if (objConfig.schema?.properties && Object.keys(objConfig.schema.properties).length > 0) {
          return this.convertPortSchemaToJsonSchema(objConfig.schema)
        }
        // Empty/no properties = allow any properties with additionalProperties
        return {
          type: 'object',
          additionalProperties: true,
          description: config.description || 'Object with any properties',
        }
      }
      case 'enum': {
        const enumConfig = config as EnumPortConfig
        schema.type = 'string'
        schema.enum = enumConfig.options?.map(o => String(o.defaultValue)) || []
        break
      }
      case 'any':
        // Return empty schema for maximum flexibility - Gemini will accept any JSON value
        return {}
      case 'stream': {
        // Convert stream to array schema - items will be converted back to stream after LLM response
        const streamConfig = config as StreamPortConfig
        const itemSchema = streamConfig.itemConfig
          ? this.convertPropertyToJsonSchema(streamConfig.itemConfig)
          : {}
        return {
          type: 'array',
          items: itemSchema ?? {},
        }
      }
      case 'secret':
        // Unsupported type - skip field (caller will filter out nulls)
        return null
      default:
        schema.type = 'string'
    }

    return schema
  }

  /**
   * Convert array item config to JSON Schema
   */
  private convertArrayItemToJsonSchema(config: ArrayPortConfig): Record<string, any> {
    if (!config.itemConfig?.type) {
      // No item type specified - default to any item type
      return {}
    }

    switch (config.itemConfig.type) {
      case 'string':
        return { type: 'string' }
      case 'number':
        return { type: 'number' }
      case 'boolean':
        return { type: 'boolean' }
      case 'object': {
        const objConfig = config.itemConfig as ObjectPortConfig
        // Only recurse if there are actual properties defined
        if (objConfig.schema?.properties && Object.keys(objConfig.schema.properties).length > 0) {
          return this.convertPortSchemaToJsonSchema(objConfig.schema)
        }
        // Empty/no properties = allow any properties with additionalProperties
        return {
          type: 'object',
          additionalProperties: true,
        }
      }
      case 'array': {
        const arrayConfig = config.itemConfig as ArrayPortConfig
        return {
          type: 'array',
          items: this.convertArrayItemToJsonSchema(arrayConfig),
        }
      }
      case 'enum': {
        const enumConfig = config.itemConfig as EnumPortConfig
        return {
          type: 'string',
          enum: enumConfig.options?.map(o => String(o.defaultValue)) || [],
        }
      }
      case 'any':
        // Empty schema accepts any JSON value
        return {}
      case 'stream': {
        // Convert stream to array schema (array of streams = array of arrays)
        const streamConfig = config.itemConfig as StreamPortConfig
        const itemSchema = streamConfig.itemConfig
          ? this.convertPropertyToJsonSchema(streamConfig.itemConfig)
          : {}
        return {
          type: 'array',
          items: itemSchema ?? {},
        }
      }
      case 'secret':
        // Unsupported type in arrays - treat as unconstrained
        return {}
      default:
        return { type: 'string' }
    }
  }

  // ============================================================================
  // Debug Logging
  // ============================================================================

  private async debugLog(context: ExecutionContext, message: string): Promise<void> {
    await context.sendEvent(
      new ExecutionEventImpl(
        0,
        ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
        new Date(),
        {
          nodeId: this.id || 'unknown',
          log: message,
        },
      ),
    )
  }
}

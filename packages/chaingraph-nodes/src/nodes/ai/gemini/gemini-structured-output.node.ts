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
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  ExecutionEventEnum,
  ExecutionEventImpl,
  Node,
  ObjectSchemaCopyTo,
  Output,
  Passthrough,
  PortBoolean,
  PortEnumFromNative,
  PortNumber,
  PortObject,
  PortString,
  PortVisibility,
} from '@badaitech/chaingraph-types'
import { GoogleGenAI } from '@google/genai'
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
 * It uses JSON mode with responseSchema for guaranteed structured output.
 *
 * Key features:
 * - Direct JSON Schema output (no function calling)
 * - System instructions support
 * - Gemini 3/2.5 thinking/reasoning
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

  // ============================================================================
  // Execute Method
  // ============================================================================

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
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

    // Convert port schema to JSON Schema
    const jsonSchema = this.convertPortSchemaToJsonSchema(schema)

    // Build generation config
    const generationConfig: Record<string, any> = {
      temperature: this.config.temperature,
      maxOutputTokens: this.config.maxOutputTokens,
      topP: this.config.topP,
      topK: this.config.topK,
      responseMimeType: 'application/json',
      responseSchema: jsonSchema,
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
    const result = await this.generateStructuredResponseWithRetries(
      genAI,
      generationConfig,
      context,
    )

    // Set the structured response
    for (const [key, value] of Object.entries(result)) {
      this.structuredResponse[key] = value
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
  ): Promise<Record<string, any>> {
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

        const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text

        if (!resultText) {
          throw new Error('No response from model')
        }

        // Parse JSON
        const parsed = JSON.parse(resultText)

        await this.debugLog(context, `Success: ${JSON.stringify(parsed, null, 2)}`)

        return parsed
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
   */
  private convertPortSchemaToJsonSchema(portSchema: IObjectSchema): Record<string, any> {
    const properties: Record<string, any> = {}
    const required: string[] = []

    for (const [key, propConfig] of Object.entries(portSchema.properties || {})) {
      properties[key] = this.convertPropertyToJsonSchema(propConfig as IPortConfig)
      if ((propConfig as IPortConfig).required) {
        required.push(key)
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
   */
  private convertPropertyToJsonSchema(config: IPortConfig): Record<string, any> {
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
        if (objConfig.schema?.properties) {
          return this.convertPortSchemaToJsonSchema(objConfig.schema)
        }
        schema.type = 'object'
        break
      }
      case 'enum': {
        const enumConfig = config as EnumPortConfig
        schema.type = 'string'
        schema.enum = enumConfig.options?.map(o => String(o.defaultValue)) || []
        break
      }
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
      return { type: 'string' }
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
        if (objConfig.schema?.properties) {
          return this.convertPortSchemaToJsonSchema(objConfig.schema)
        }
        return { type: 'object' }
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

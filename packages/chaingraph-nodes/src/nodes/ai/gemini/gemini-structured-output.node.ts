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
import type { Content, ContentListUnion, GenerateContentConfig, Part, ThinkingLevel } from '@google/genai'
import {
  BaseNode,
  ExecutionEventEnum,
  ExecutionEventImpl,
  MultiChannel,
  Node,
  ObjectSchemaCopyTo,
  Output,
  Passthrough,
  PortArray,
  PortBoolean,
  PortEnumFromNative,
  PortNumber,
  PortObject,
  PortStream,
  PortString,
  PortVisibility,
} from '@badaitech/chaingraph-types'
import { GoogleGenAI } from '@google/genai'
import { NODE_CATEGORIES } from '../../../categories'
import {
  ConversationMessage,
  GeminiMessagePart,
} from './gemini-conversation-types'
import {
  GeminiPartTypeSupport,
  convertAPIPartToMessagePart as sharedConvertAPIPartToMessagePart,
  convertMessageToAPIFormat as sharedConvertMessageToAPIFormat,

  convertPartsToAPIFormatBatch as sharedConvertPartsToAPIFormatBatch,

  convertPartToAPIFormat as sharedConvertPartToAPIFormat,
} from './gemini-part-converters'
import {
  GeminiGenerationConfig,
  GeminiThinkingLevelFlash,
  GeminiThinkingLevelPro,
  isGemini3FlashModel,
  isGemini3Model,
  isGemini3ProModel,
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
  category: NODE_CATEGORIES.GEMINI,
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
  // Conversation Inputs
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Input Message',
    description: `**Your current message to the model**

Add parts with text, images, files, code:
- **Text only** → \`[{ text: "Extract data from this text..." }]\`
- **Text + file** → \`[{ fileData: { fileUri: "url" } }, { text: "Extract data" }]\`
- **Code execution** → \`[{ executableCode: { code: "...", language: "PYTHON" } }]\`

**Note:** Structured output works with TEXT models only, not image generation models.

Build with Gemini Message Part + Array Add nodes.`,
    schema: ConversationMessage,
    required: true,
  })
  inputMessage: ConversationMessage = new ConversationMessage()

  @Passthrough()
  @PortArray({
    title: 'Previous Messages',
    description: `**Conversation history (optional)**

Chain from previous Gemini nodes for multi-turn structured extraction:
- Context-aware data extraction
- Follow-up refinement
- Iterative schema evolution

Leave empty for single-shot operations.`,
    itemConfig: {
      type: 'object',
      schema: ConversationMessage,
    },
    isMutable: true,
    defaultValue: [],
    ui: {
      collapsed: true,
    },
  })
  previousMessages: ConversationMessage[] = []

  @Passthrough()
  @PortString({
    title: 'System Instructions',
    description: 'System-level instructions for the model (separate from conversation)',
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
    showIf: (node: INode) => isGemini3ProModel((node as GeminiStructuredOutputNode).config.model),
  })
  @PortEnumFromNative(GeminiThinkingLevelPro, {
    title: 'Thinking Level',
    description: 'Gemini 3 Pro reasoning depth (low = faster, high = deeper)',
    defaultValue: GeminiThinkingLevelPro.High,
  })
  thinkingLevelPro: GeminiThinkingLevelPro = GeminiThinkingLevelPro.High

  @Passthrough()
  @PortVisibility({
    showIf: (node: INode) => isGemini3FlashModel((node as GeminiStructuredOutputNode).config.model),
  })
  @PortEnumFromNative(GeminiThinkingLevelFlash, {
    title: 'Thinking Level',
    description: `Gemini 3 Flash reasoning depth:
- **Minimal** — No thinking, fastest latency
- **Low** — Minimal reasoning, fast
- **Medium** — Balanced thinking
- **High** — Deep reasoning (default)`,
    defaultValue: GeminiThinkingLevelFlash.High,
  })
  thinkingLevelFlash: GeminiThinkingLevelFlash = GeminiThinkingLevelFlash.High

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

  @Output()
  @PortStream({
    title: 'Parts Stream (Raw)',
    description: `**Raw model response parts for programmatic processing**

Streams raw \`GeminiMessagePart\` objects as they arrive:
- \`{ text: "..." }\` — JSON chunks (partial structured output)
- \`{ thought: true, text: "..." }\` — Reasoning content

Use this for:
- Real-time UI updates during generation
- Progress indicators
- Displaying thoughts/partial results as they arrive`,
    itemConfig: {
      type: 'object',
      schema: GeminiMessagePart,
    },
    defaultValue: new MultiChannel<GeminiMessagePart>(),
  })
  partsStream: MultiChannel<GeminiMessagePart> = new MultiChannel<GeminiMessagePart>()

  @Output()
  @PortArray({
    title: 'Messages',
    description: `**Conversation history for chaining**

Contains only the new exchange:
- Input message (cleaned)
- Model response (with structured output as text)

Chain to another Gemini node's "Previous Messages" for multi-turn structured extraction workflows.`,
    itemConfig: {
      type: 'object',
      schema: ConversationMessage,
    },
  })
  messages: ConversationMessage[] = []

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

    if (!this.inputMessage.parts || this.inputMessage.parts.length === 0) {
      throw new Error('Input message must contain at least one part')
    }

    // Explicitly resolve the stream port - downstream nodes can start reading NOW
    // Using new thread-safe signature with explicit node ID
    context.resolvePort(this.id, 'thoughts')
    context.resolvePort(this.id, 'partsStream')

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

    // If debug enabled, log the JSON schema
    if (this.config.debug) {
      await this.debugLog(context, `Using JSON Schema: ${JSON.stringify(jsonSchema, null, 2)}`)
    }

    // Build generation config
    // Auto-apply temperature 1.0 for Gemini 3 models (Google's recommendation)
    const generationConfig: GenerateContentConfig = {
      temperature: isGemini3Model(this.config.model) ? 1.0 : this.config.temperature,
      maxOutputTokens: this.config.maxOutputTokens,
      topP: this.config.topP,
      topK: this.config.topK,
      responseMimeType: 'application/json',
      responseJsonSchema: jsonSchema, // Use full JSON Schema (supports additionalProperties)
      abortSignal: context.abortSignal,
    }

    // System instruction (optional)
    if (this.systemInstruction?.trim()) {
      generationConfig.systemInstruction = this.systemInstruction
    }

    // Thinking config - model specific
    if (isGemini3FlashModel(this.config.model)) {
      // Gemini 3 Flash uses thinkingLevelFlash (supports minimal, low, medium, high)
      generationConfig.thinkingConfig = {
        thinkingLevel: mapThinkingLevel(this.thinkingLevelFlash),
        includeThoughts: this.includeThoughts,
      }
    } else if (isGemini3ProModel(this.config.model)) {
      // Gemini 3 Pro uses thinkingLevelPro (supports low, high only)
      generationConfig.thinkingConfig = {
        thinkingLevel: mapThinkingLevel(this.thinkingLevelPro),
        includeThoughts: this.includeThoughts,
      }
    } else if (isGemini25Model(this.config.model)) {
      // Gemini 2.5 uses thinkingBudget
      generationConfig.thinkingConfig = {
        thinkingBudget: this.thinkingBudget,
        includeThoughts: this.includeThoughts,
      }
    }

    // If debug enabled, log the base generation config
    if (this.config.debug) {
      await this.debugLog(context, `Base Generation Config: ${JSON.stringify(generationConfig, null, 2)}`)
    }

    // Build conversation contents from previousMessages + inputMessage
    const contents: Content[] = []

    // 1. Add previous conversation messages if any
    if (this.previousMessages && this.previousMessages.length > 0) {
      const convertedMessages = await Promise.all(
        this.previousMessages.map(msg => this.convertMessageToAPIFormat(msg, context)),
      )
      for (const content of convertedMessages) {
        if (content) {
          contents.push(content)
        }
      }
    }

    // 2. Process inputMessage parts with parallel conversion
    const allCurrentParts = await this.convertPartsToAPIFormatBatch(this.inputMessage.parts, context)
    const currentParts = allCurrentParts.filter((p): p is Part => p !== null)

    if (currentParts.length === 0) {
      throw new Error('Input message must contain at least one valid part')
    }

    // 3. Add current user message
    contents.push({
      role: 'user',
      parts: currentParts,
    })

    // Execute with retry logic
    const { parsed, thoughts, collectedParts } = await this.generateStructuredResponseWithRetries(
      genAI,
      contents,
      generationConfig,
      context,
    )

    // Stream thoughts if any were collected
    this.thoughts = new MultiChannel<string>()
    if (thoughts.length > 0) {
      for (const thought of thoughts) {
        this.thoughts.send(thought)

        if (this.config.debug) {
          await this.debugLog(context, `Streaming Thought: ${thought}`)
        }
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

    // Build output messages - ONLY the new exchange (not including previousMessages)
    // Clean user input to remove invalid fields
    const allCleanedInputParts = await this.convertPartsToAPIFormatBatch(this.inputMessage.parts)
    const cleanedInputParts = allCleanedInputParts.filter((p): p is Part => p !== null)

    this.messages = [
      // User's input message (cleaned)
      {
        role: this.inputMessage.role,
        parts: cleanedInputParts.map(p => this.convertAPIPartToMessagePart(p)),
      },
      // Model's response with ALL parts
      {
        role: 'model' as const,
        parts: collectedParts.map(p => this.convertAPIPartToMessagePart(p)),
      },
    ]

    return {}
  }

  // ============================================================================
  // Retry Logic
  // ============================================================================

  private async generateStructuredResponseWithRetries(
    genAI: GoogleGenAI,
    contents: ContentListUnion,
    config: GenerateContentConfig,
    context: ExecutionContext,
  ): Promise<{ parsed: Record<string, any>, thoughts: string[], collectedParts: Part[] }> {
    for (let attempt = 0; attempt < GEMINI_MAX_RETRIES; attempt++) {
      try {
        if (this.config.debug) {
          await this.debugLog(context, `Attempt ${attempt + 1}/${GEMINI_MAX_RETRIES}`)
        }

        // Use streaming API to support real-time parts output
        const stream = await genAI.models.generateContentStream({
          model: this.config.model,
          contents,
          config,
        })

        // Collect response parts and JSON chunks
        const collectedParts: Part[] = []
        let jsonBuffer = ''
        const thoughtTexts: string[] = []

        // Stream chunks in real-time
        for await (const chunk of stream) {
          // Check abort
          if (context.abortSignal.aborted) {
            this.partsStream.close()
            this.partsStream.setError(new Error('Stream aborted'))
            throw new Error('Stream aborted')
          }

          const chunkParts = chunk.candidates?.[0]?.content?.parts || []
          for (const part of chunkParts) {
            // Collect for final output
            collectedParts.push(part)

            // Send to raw parts stream for real-time UI updates
            const messagePart = this.convertAPIPartToMessagePart(part)
            this.partsStream.send(messagePart)

            // Separate thoughts from JSON content
            if (part.thought && part.text) {
              thoughtTexts.push(part.text)
            } else if (part.text) {
              jsonBuffer += part.text
            }
          }
        }

        // Close parts stream
        this.partsStream.close()

        // debug json response:
        if (this.config.debug) {
          await this.debugLog(context, `Collected JSON Buffer: ${jsonBuffer}`)
          await this.debugLog(context, `Collected ${collectedParts.length} parts`)
        }

        if (!jsonBuffer) {
          throw new Error('No response content from model (only thought parts received or empty response)')
        }

        // Parse JSON
        const parsed = JSON.parse(jsonBuffer)

        if (this.config.debug) {
          await this.debugLog(context, `Success: ${JSON.stringify(parsed, null, 2)}`)
        }

        return { parsed, thoughts: thoughtTexts, collectedParts }
      } catch (error: any) {
        const errorMsg = error?.message || String(error)

        // Close parts stream on error
        this.partsStream.close()

        if (attempt >= GEMINI_MAX_RETRIES - 1) {
          // Last attempt failed
          if (this.config.debug) {
            await this.debugLog(context, `All retries failed: ${errorMsg}`)
          }
          throw new Error(`Failed after ${GEMINI_MAX_RETRIES} attempts: ${errorMsg}`)
        } else {
          // Retry - reinitialize parts stream for next attempt
          this.partsStream = new MultiChannel<GeminiMessagePart>()
          if (this.config.debug) {
            await this.debugLog(context, `Attempt ${attempt + 1} failed: ${errorMsg}, retrying...`)
          }
        }
      }
    }

    // Shouldn't reach here
    throw new Error('Maximum retries exceeded')
  }

  // ============================================================================
  // Part Conversion Helpers
  // ============================================================================

  /**
   * Convert GeminiMessagePart to API Part format.
   * Delegates to shared utility with TEXT_STRUCTURED support.
   * Supports: text, fileData, functionCall, functionResponse, executableCode, codeExecutionResult, videoMetadata
   * Does NOT support: inlineData (inline images) - use fileData for image URLs instead
   */
  private async convertPartToAPIFormat(part: GeminiMessagePart, context?: ExecutionContext): Promise<Part | null> {
    return sharedConvertPartToAPIFormat(
      part,
      GeminiPartTypeSupport.TEXT_STRUCTURED,
      context,
      this.config.debug ? this.debugLog.bind(this) : undefined,
    )
  }

  /**
   * Convert multiple parts to API format in parallel while maintaining order.
   * Delegates to shared utility with TEXT_STRUCTURED support.
   */
  private async convertPartsToAPIFormatBatch(
    parts: GeminiMessagePart[],
    context?: ExecutionContext,
  ): Promise<(Part | null)[]> {
    return sharedConvertPartsToAPIFormatBatch(
      parts,
      GeminiPartTypeSupport.TEXT_STRUCTURED,
      context,
      this.config.debug ? this.debugLog.bind(this) : undefined,
    )
  }

  /**
   * Convert a complete message to API format.
   * Delegates to shared utility with TEXT_STRUCTURED support for parallel conversion and null filtering.
   */
  private async convertMessageToAPIFormat(
    message: { role: string, parts: GeminiMessagePart[] },
    context?: ExecutionContext,
  ): Promise<{ role: string, parts: Part[] } | null> {
    return sharedConvertMessageToAPIFormat(
      message,
      GeminiPartTypeSupport.TEXT_STRUCTURED,
      context,
      this.config.debug ? this.debugLog.bind(this) : undefined,
    )
  }

  /**
   * Convert API Part to GeminiMessagePart format.
   * Delegates to shared utility
   */
  private convertAPIPartToMessagePart(part: Part): GeminiMessagePart {
    return sharedConvertAPIPartToMessagePart(part)
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

/**
 * Maps thinking level enum value to SDK's ThinkingLevel
 * Accepts string values from any thinking level enum (Pro, Flash, or Legacy)
 */
function mapThinkingLevel(value: string): ThinkingLevel {
  switch (value) {
    case 'THINKING_LEVEL_UNSPECIFIED':
      return 'THINKING_LEVEL_UNSPECIFIED' as ThinkingLevel
    case 'MINIMAL':
      return 'MINIMAL' as ThinkingLevel
    case 'LOW':
      return 'LOW' as ThinkingLevel
    case 'MEDIUM':
      return 'MEDIUM' as ThinkingLevel
    case 'HIGH':
      return 'HIGH' as ThinkingLevel
    default:
      return 'HIGH' as ThinkingLevel
  }
}

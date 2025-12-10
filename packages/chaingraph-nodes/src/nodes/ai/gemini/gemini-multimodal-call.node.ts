/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  INode,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import type { Content, GenerateContentConfig, GroundingChunk, MediaResolution, Part, ThinkingLevel } from '@google/genai'
import {
  BaseNode,
  MultiChannel,
  Node,
  Output,
  Passthrough,
  PortArray,
  PortEnumFromNative,
  PortNumber,
  PortObject,
  PortStream,
  PortString,
  PortVisibility,
} from '@badaitech/chaingraph-types'
import { GoogleGenAI } from '@google/genai'
import { NODE_CATEGORIES } from '../../../categories'
import { ConversationMessage, GeminiMessagePart } from './gemini-conversation-types'
import {
  GeminiGenerationConfig,
  GeminiMediaResolution,
  GeminiOutputConfig,
  GeminiThinkingLevel,
  isGemini3Model,
  isGemini25Model,
} from './gemini-types'

/**
 * Tags for formatting streamed output (same pattern as Anthropic node)
 * These tags are parsed by the frontend's MarkdownComponentThoughts component
 */
const TAGS = {
  THINK: {
    OPEN: '\n~~~thoughts\n',
    CLOSE: '\n~~~\n',
  },
  TOOL_USE: {
    OPEN: '<tool_use>\n',
    CLOSE: '</tool_use>\n',
    ID: { OPEN: '<tool_id>', CLOSE: '</tool_id>\n' },
    NAME: { OPEN: '<tool_name>', CLOSE: '</tool_name>\n' },
    INPUT: { OPEN: '<tool_input>\n', CLOSE: '\n</tool_input>\n' },
  },
  TOOL_RESULT: {
    OPEN: '<tool_result>\n',
    CLOSE: '</tool_result>\n',
    ID: { OPEN: '<tool_result_id>', CLOSE: '</tool_result_id>\n' },
    CONTENT: { OPEN: '<tool_result_content>\n', CLOSE: '\n</tool_result_content>\n' },
  },
}

/**
 * Maps our GeminiThinkingLevel enum to SDK's ThinkingLevel enum
 */
function mapThinkingLevel(value: GeminiThinkingLevel): ThinkingLevel {
  switch (value) {
    case GeminiThinkingLevel.Unspecified:
      return 'THINKING_LEVEL_UNSPECIFIED' as ThinkingLevel
    case GeminiThinkingLevel.Low:
      return 'LOW' as ThinkingLevel
    case GeminiThinkingLevel.High:
      return 'HIGH' as ThinkingLevel
    default:
      return 'HIGH' as ThinkingLevel
  }
}

/**
 * Maps our GeminiMediaResolution enum to SDK's MediaResolution enum
 */
function mapMediaResolution(value: GeminiMediaResolution): MediaResolution {
  switch (value) {
    case GeminiMediaResolution.Unspecified:
      return 'MEDIA_RESOLUTION_UNSPECIFIED' as MediaResolution
    case GeminiMediaResolution.Low:
      return 'MEDIA_RESOLUTION_LOW' as MediaResolution
    case GeminiMediaResolution.Medium:
      return 'MEDIA_RESOLUTION_MEDIUM' as MediaResolution
    case GeminiMediaResolution.High:
      return 'MEDIA_RESOLUTION_HIGH' as MediaResolution
    default:
      return 'MEDIA_RESOLUTION_HIGH' as MediaResolution
  }
}

/**
 * Gemini Multimodal Call Node
 *
 * This node provides access to Google Gemini's multimodal capabilities including:
 * - Text generation with streaming
 * - YouTube video understanding
 * - Image analysis
 * - Video file processing
 *
 * Uses the native @google/genai SDK for full feature support including YouTube URLs
 * which are not available through LangChain.
 *
 * Port organization follows Anthropic node pattern:
 * 1. config (API key, model, generation params)
 * 2. inputMessage, previousMessages, systemInstruction (conversation inputs)
 * 3. outputConfig (formatting options)
 * 4. thinking ports (model-specific, @PortVisibility)
 * 5. textStream, partsStream (dual streaming outputs)
 * 6. messages (conversation history output)
 */
@Node({
  type: 'GeminiMultimodalCallNode',
  title: 'Gemini Multimodal Call',
  description: 'Call Gemini with text, images, videos, and YouTube URLs with streaming output',
  category: NODE_CATEGORIES.GEMINI,
  tags: ['ai', 'gemini', 'video', 'youtube', 'multimodal', 'image', 'streaming'],
})
export class GeminiMultimodalCallNode extends BaseNode {
  // ============================================================================
  // Configuration (at top, like Anthropic node)
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

Add parts with text, images, files, code, etc.:
- **Text only** → \`[{ text: "Your prompt" }]\`
- **Text + image** → \`[{ fileData: { fileUri: "url" } }, { text: "Describe this" }]\`
- **YouTube + text** → \`[{ fileData: { fileUri: "youtube.com/..." } }, { text: "Summarize" }]\`
- **Code execution** → \`[{ executableCode: "print('hello')" }]\`

Build with Gemini Message Part + Array Add, or use Archai converter.`,
    schema: ConversationMessage,
    required: true,
  })
  inputMessage: ConversationMessage = new ConversationMessage()

  @Passthrough()
  @PortArray({
    title: 'Previous Messages',
    description: `**Conversation history (optional)**

Chain from previous Gemini nodes for multi-turn conversations:
- Context-aware responses
- Follow-up questions
- Iterative refinement

Connects seamlessly with Gemini Multimodal Image messages output.`,
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
  // Output Configuration (formatting options)
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Output Format',
    description: 'Configure how search results and citations appear in output',
    schema: GeminiOutputConfig,
    ui: {
      collapsed: false,
    },
  })
  outputConfig: GeminiOutputConfig = new GeminiOutputConfig()

  // ============================================================================
  // Thinking / Reasoning (Model-specific with @PortVisibility)
  // Must stay at root level for @PortVisibility to work
  // ============================================================================

  @Passthrough()
  @PortVisibility({
    showIf: (node: INode) => isGemini3Model((node as GeminiMultimodalCallNode).config.model),
  })
  @PortEnumFromNative(GeminiThinkingLevel, {
    title: 'Thinking Level',
    description: 'Gemini 3 reasoning depth (low = faster, high = deeper)',
    defaultValue: GeminiThinkingLevel.High,
  })
  thinkingLevel: GeminiThinkingLevel = GeminiThinkingLevel.High

  @Passthrough()
  @PortVisibility({
    showIf: (node: INode) => isGemini25Model((node as GeminiMultimodalCallNode).config.model),
  })
  @PortNumber({
    title: 'Thinking Budget',
    description: 'Token budget for reasoning (0 = disable, -1 = dynamic, max 32768)',
    min: -1,
    max: 32768,
    defaultValue: -1,
  })
  thinkingBudget: number = -1

  // ============================================================================
  // Output
  // ============================================================================

  @Output()
  @PortStream({
    title: 'Text Stream (Formatted)',
    description: `**Human-readable text output with formatting**

Streams formatted text including:
- Regular text responses
- Thinking content (wrapped in \`~~~thoughts\` blocks)
- Tool calls/results (wrapped in XML tags)

Use this for direct display in chat interfaces.`,
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
    defaultValue: new MultiChannel<string>(),
  })
  textStream: MultiChannel<string> = new MultiChannel<string>()

  @Output()
  @PortStream({
    title: 'Parts Stream (Raw)',
    description: `**Raw model response parts for programmatic processing**

Streams raw \`GeminiMessagePart\` objects as they arrive:
- \`{ text: "..." }\` — Text content
- \`{ inlineData: { data, mimeType } }\` — Images, audio
- \`{ functionCall: { name, args } }\` — Tool invocations
- \`{ functionResponse: { name, response } }\` — Tool results
- \`{ executableCode: "..." }\` — Code to execute
- \`{ thought: true, text: "..." }\` — Reasoning content

Use this for:
- Dynamic UI rendering (show images inline, highlight code, etc.)
- Tool call interception and handling
- Custom streaming displays`,
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

Full conversation including:
- Previous messages (input)
- Input message (current)
- Model response (generated)

Chain to another Gemini node's "Previous Messages" for multi-turn workflows.`,
    itemConfig: {
      type: 'object',
      schema: ConversationMessage,
    },
  })
  messages: ConversationMessage[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate
    if (!this.config.apiKey) {
      throw new Error('API Key is required')
    }

    if (!this.inputMessage.parts || this.inputMessage.parts.length === 0) {
      throw new Error('Input message must contain at least one part')
    }

    // Decrypt the API key
    const { apiKey } = await this.config.apiKey.decrypt(context)

    // Initialize the Gemini API client
    const genAI = new GoogleGenAI({ apiKey })

    // Build conversation contents from previousMessages + inputMessage
    const contents: Content[] = []

    // 1. Add previous conversation messages if any
    if (this.previousMessages && this.previousMessages.length > 0) {
      for (const msg of this.previousMessages) {
        contents.push({
          role: msg.role,
          parts: msg.parts.map(p => this.convertPartToAPIFormat(p)),
        })
      }
    }

    // 2. Add current input message
    const currentParts = this.inputMessage.parts.map(p => this.convertPartToAPIFormat(p))
    contents.push({
      role: 'user',
      parts: currentParts,
    })

    // Build generation config
    const generationConfig: GenerateContentConfig = {
      temperature: this.config.temperature,
      maxOutputTokens: this.config.maxOutputTokens,
      topP: this.config.topP,
      topK: this.config.topK,
      abortSignal: context.abortSignal,
    }

    // Add system instruction if provided
    if (this.systemInstruction && this.systemInstruction.trim().length > 0) {
      generationConfig.systemInstruction = this.systemInstruction
    }

    // Thinking config - model specific
    if (isGemini3Model(this.config.model)) {
      // Gemini 3 uses thinkingLevel
      generationConfig.thinkingConfig = {
        thinkingLevel: mapThinkingLevel(this.thinkingLevel),
        includeThoughts: this.outputConfig.includeThoughts,
      }
    } else if (isGemini25Model(this.config.model)) {
      // Gemini 2.5 uses thinkingBudget
      generationConfig.thinkingConfig = {
        thinkingBudget: this.thinkingBudget,
        includeThoughts: this.outputConfig.includeThoughts,
      }
    }

    // Google Search grounding
    if (this.config.enableGoogleSearch) {
      generationConfig.tools = [{ googleSearch: {} }]
    }

    // Start streaming in the background
    const collectedResponseParts: Part[] = []
    const streamingPromise = async () => {
      try {
        // Generate content with streaming (multi-turn conversation support)
        const stream = await genAI.models.generateContentStream({
          model: this.config.model,
          contents,
          config: generationConfig,
        })

        // Track state across chunks
        let inThinkingBlock = false
        let searchQueryId = 0
        const processedQueries = new Set<string>()
        const groundingChunks: GroundingChunk[] = []

        // Stream the response chunks
        for await (const chunk of stream) {
          // Check if execution was aborted
          if (context.abortSignal.aborted) {
            this.textStream.close()
            this.partsStream.close()
            this.textStream.setError(new Error('Stream aborted'))
            this.partsStream.setError(new Error('Stream aborted'))
            return
          }

          // Process grounding metadata (may arrive before or with text)
          const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata
          if (groundingMetadata) {
            // Emit search queries as tool_use (if enabled and not already processed)
            if (this.outputConfig.includeSearchQueries && groundingMetadata.webSearchQueries) {
              for (const query of groundingMetadata.webSearchQueries) {
                if (!processedQueries.has(query)) {
                  processedQueries.add(query)
                  // Close thinking block if open before emitting tool_use
                  if (inThinkingBlock) {
                    this.textStream.send(TAGS.THINK.CLOSE)
                    inThinkingBlock = false
                  }
                  this.emitWebSearchToolUse(++searchQueryId, query)
                }
              }
            }

            // Collect grounding chunks for later (deduplicated)
            if (groundingMetadata.groundingChunks) {
              for (const chunk of groundingMetadata.groundingChunks) {
                const uri = chunk?.web?.uri
                if (uri && !groundingChunks.some(c => c?.web?.uri === uri)) {
                  groundingChunks.push(chunk)
                }
              }
            }
          }

          // Process all parts in the chunk
          const chunkParts = chunk.candidates?.[0]?.content?.parts || []
          for (const part of chunkParts) {
            // Collect parts for messages output
            collectedResponseParts.push(part)

            // === Send raw part to partsStream for programmatic processing ===
            const messagePart = this.convertAPIPartToMessagePart(part)
            this.partsStream.send(messagePart)

            // === Send formatted text to textStream for display ===
            // Check if this is a thought part (Gemini marks thoughts with thought: true)
            if (part.thought && part.text) {
              // Thought content - wrap in ~~~thoughts block
              if (!inThinkingBlock) {
                this.textStream.send(TAGS.THINK.OPEN)
                inThinkingBlock = true
              }
              this.textStream.send(part.text)
            } else if (part.text) {
              // Close thinking block if we were in one
              if (inThinkingBlock) {
                this.textStream.send(TAGS.THINK.CLOSE)
                inThinkingBlock = false
              }
              // Regular response content
              this.textStream.send(part.text)
            }
          }
        }

        // Close any open thinking block at the end
        if (inThinkingBlock) {
          this.textStream.send(TAGS.THINK.CLOSE)
        }

        // Emit search results as tool_result (if enabled and we have sources)
        if (groundingChunks.length > 0 && this.outputConfig.includeSearchSources) {
          this.emitWebSearchToolResult(searchQueryId, groundingChunks)
        }

        // Add footnotes section (if enabled and we have sources)
        if (groundingChunks.length > 0 && this.outputConfig.includeFootnotes) {
          this.emitFootnotes(groundingChunks)
        }

        // Build messages output with full conversation history
        this.messages = [
          ...(this.previousMessages || []),
          this.inputMessage,
          {
            role: 'model' as const,
            parts: collectedResponseParts.map(p => this.convertAPIPartToMessagePart(p)),
          },
        ]
      } catch (error: any) {
        const errorMessage = error?.message || String(error)
        this.textStream.setError(new Error(`Gemini API error: ${errorMessage}`))
        this.partsStream.setError(new Error(`Gemini API error: ${errorMessage}`))
        throw error
      } finally {
        // Close both streams in any case
        this.textStream.close()
        this.partsStream.close()
      }
    }

    await streamingPromise()

    return {}
  }

  /**
   * Convert GeminiMessagePart to API Part format
   */
  private convertPartToAPIFormat(part: any): Part {
    const apiPart: Part = {}

    if (part.text) {
      apiPart.text = part.text
    }
    if (part.inlineData) {
      apiPart.inlineData = part.inlineData
    }
    if (part.fileData) {
      apiPart.fileData = part.fileData
    }
    if (part.functionCall) {
      // Parse args from JSON string
      apiPart.functionCall = {
        name: part.functionCall.name,
        args: part.functionCall.args ? JSON.parse(part.functionCall.args) : {},
      }
    }
    if (part.functionResponse) {
      // Parse response from JSON string
      apiPart.functionResponse = {
        name: part.functionResponse.name,
        response: part.functionResponse.response ? JSON.parse(part.functionResponse.response) : {},
      }
    }
    if (part.executableCode) {
      apiPart.executableCode = { code: part.executableCode }
    }
    if (part.codeExecutionResult) {
      apiPart.codeExecutionResult = part.codeExecutionResult
    }
    if (part.thought !== undefined) {
      (apiPart as any).thought = part.thought
    }
    if (part.thoughtSignature) {
      (apiPart as any).thoughtSignature = part.thoughtSignature
    }
    if (part.videoMetadata) {
      apiPart.videoMetadata = part.videoMetadata
    }

    return apiPart
  }

  /**
   * Convert API Part to GeminiMessagePart format
   */
  private convertAPIPartToMessagePart(part: Part): any {
    const messagePart: any = {}

    if (part.text) {
      messagePart.text = part.text
    }
    if (part.inlineData) {
      messagePart.inlineData = part.inlineData
    }
    if (part.fileData) {
      messagePart.fileData = part.fileData
    }
    if (part.functionCall) {
      messagePart.functionCall = {
        name: part.functionCall.name,
        args: JSON.stringify(part.functionCall.args || {}),
      }
    }
    if (part.functionResponse) {
      messagePart.functionResponse = {
        name: part.functionResponse.name,
        response: JSON.stringify(part.functionResponse.response || {}),
      }
    }
    if (part.executableCode) {
      messagePart.executableCode = (part.executableCode as any).code || part.executableCode
    }
    if (part.codeExecutionResult) {
      messagePart.codeExecutionResult = part.codeExecutionResult
    }
    if ((part as any).thought !== undefined) {
      messagePart.thought = (part as any).thought
    }
    if ((part as any).thoughtSignature) {
      messagePart.thoughtSignature = (part as any).thoughtSignature
    }
    if (part.videoMetadata) {
      messagePart.videoMetadata = part.videoMetadata
    }

    return messagePart
  }

  // ============================================================================
  // Output Formatting Helpers
  // ============================================================================

  /**
   * Emit a web search query as a tool_use block
   * Format matches the frontend's parseContent() expectations
   */
  private emitWebSearchToolUse(id: number, query: string): void {
    const toolUse = `${TAGS.THINK.OPEN}${TAGS.TOOL_USE.OPEN}`
      + `${TAGS.TOOL_USE.ID.OPEN}search_${id}${TAGS.TOOL_USE.ID.CLOSE}`
      + `${TAGS.TOOL_USE.NAME.OPEN}web_search${TAGS.TOOL_USE.NAME.CLOSE}`
      + `${TAGS.TOOL_USE.INPUT.OPEN}${JSON.stringify({ input: { query } })}${TAGS.TOOL_USE.INPUT.CLOSE}`
      + `${TAGS.TOOL_USE.CLOSE}${TAGS.THINK.CLOSE}`
    this.textStream.send(toolUse)
  }

  /**
   * Emit web search results as a tool_result block
   * Results must have type: "web_search_result" for frontend detection
   */
  private emitWebSearchToolResult(id: number, chunks: GroundingChunk[]): void {
    const results = chunks
      .filter(c => c?.web)
      .map(c => ({
        type: 'web_search_result',
        title: c.web?.title || c.web?.domain || 'Unknown',
        url: c.web?.uri,
      }))

    if (results.length === 0) {
      return
    }

    const toolResult = `${TAGS.THINK.OPEN}${TAGS.TOOL_RESULT.OPEN}`
      + `${TAGS.TOOL_RESULT.ID.OPEN}search_${id}${TAGS.TOOL_RESULT.ID.CLOSE}`
      + `${TAGS.TOOL_RESULT.CONTENT.OPEN}${JSON.stringify(results)}${TAGS.TOOL_RESULT.CONTENT.CLOSE}`
      + `${TAGS.TOOL_RESULT.CLOSE}${TAGS.THINK.CLOSE}`
    this.textStream.send(toolResult)
  }

  /**
   * Emit a markdown footnotes section with source links
   */
  private emitFootnotes(chunks: GroundingChunk[]): void {
    const validChunks = chunks.filter(c => c?.web?.uri)
    if (validChunks.length === 0) {
      return
    }

    const footnotes = validChunks
      .map((c, i) => `[^${i + 1}]: [${c.web?.title || c.web?.domain || 'Source'}](${c.web?.uri})`)
      .join('\n')

    this.textStream.send(`\n\n---\n**Sources:**\n${footnotes}\n`)
  }
}

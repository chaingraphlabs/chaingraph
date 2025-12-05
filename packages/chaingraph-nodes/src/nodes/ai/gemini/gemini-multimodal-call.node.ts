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
import type { Part, VideoMetadata } from '@google/genai'
import {
  BaseNode,
  MultiChannel,
  Node,
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
import { GoogleGenAI } from '@google/genai'
import { NODE_CATEGORIES } from '../../../categories'
import {
  GeminiGenerationConfig,
  GeminiMediaConfig,
  GeminiThinkingLevel,
  isGemini3Model,
  isGemini25Model,
  supportsThinking,
} from './gemini-types'

/**
 * Tags for formatting streamed output (same pattern as Anthropic node)
 */
const TAGS = {
  THINK: {
    OPEN: '\n~~~thoughts\n',
    CLOSE: '\n~~~\n',
  },
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
 * 2. prompt, systemInstruction (content inputs)
 * 3. media (multimodal inputs, collapsed)
 * 4. thinking ports (model-specific, @PortVisibility)
 * 5. outputStream
 */
@Node({
  type: 'GeminiMultimodalCallNode',
  title: 'Gemini Multimodal Call',
  description: 'Call Gemini with text, images, videos, and YouTube URLs with streaming output',
  category: NODE_CATEGORIES.AI,
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
  // Content Inputs (prompt and system together)
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
  // Media Inputs (collapsed for cleaner UI)
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Media',
    description: 'Images, videos, and YouTube URLs for multimodal input',
    schema: GeminiMediaConfig,
    ui: {
      collapsed: true,
    },
  })
  media: GeminiMediaConfig = new GeminiMediaConfig()

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

  @Passthrough()
  @PortVisibility({
    showIf: (node: INode) => supportsThinking((node as GeminiMultimodalCallNode).config.model),
  })
  @PortBoolean({
    title: 'Include Thoughts',
    description: 'Stream thought summaries in output (wrapped in ~~~thoughts blocks)',
    defaultValue: false,
  })
  includeThoughts: boolean = false

  // ============================================================================
  // Output
  // ============================================================================

  @Output()
  @PortStream({
    title: 'Output Stream',
    description: 'Streaming output from Gemini',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
    defaultValue: new MultiChannel<string>(),
  })
  outputStream: MultiChannel<string> = new MultiChannel<string>()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.config.apiKey) {
      throw new Error('API Key is required')
    }

    if (!this.prompt) {
      throw new Error('Prompt is required')
    }

    // Decrypt the API key
    const { apiKey } = await this.config.apiKey.decrypt(context)

    // Initialize the Gemini API client
    const genAI = new GoogleGenAI({ apiKey })

    // Build the content parts array
    const parts: Part[] = []

    // Add text prompt
    parts.push({ text: this.prompt })

    // Add media content if configured (YouTube URLs, images, videos)
    this.addMediaParts(parts)

    // Build generation config
    const generationConfig: Record<string, any> = {
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
        thinkingLevel: this.thinkingLevel,
        includeThoughts: this.includeThoughts,
      }
    } else if (isGemini25Model(this.config.model)) {
      // Gemini 2.5 uses thinkingBudget
      generationConfig.thinkingConfig = {
        thinkingBudget: this.thinkingBudget,
        includeThoughts: this.includeThoughts,
      }
    }

    // Google Search grounding
    if (this.config.enableGoogleSearch) {
      generationConfig.tools = [{ googleSearch: {} }]
    }

    // Media resolution (only if media content exists)
    const hasMedia = (this.media.youtubeUrls && this.media.youtubeUrls.length > 0)
      || (this.media.imageUris && this.media.imageUris.length > 0)
      || (this.media.videoUris && this.media.videoUris.length > 0)
    if (hasMedia) {
      generationConfig.mediaResolution = this.media.mediaResolution
    }

    // Start streaming in the background
    const streamingPromise = async () => {
      try {
        // Generate content with streaming
        const stream = await genAI.models.generateContentStream({
          model: this.config.model,
          contents: [{
            role: 'user',
            parts,
          }],
          config: generationConfig,
        })

        // Track if we're currently in a thinking block
        let inThinkingBlock = false

        // Stream the response chunks
        for await (const chunk of stream) {
          // Check if execution was aborted
          if (context.abortSignal.aborted) {
            this.outputStream.close()
            this.outputStream.setError(new Error('Stream aborted'))
            return
          }

          // Process all parts in the chunk
          const chunkParts = chunk.candidates?.[0]?.content?.parts || []
          for (const part of chunkParts) {
            // Check if this is a thought part (Gemini marks thoughts with thought: true)
            if ((part as any).thought && part.text) {
              // Thought content - wrap in ~~~thoughts block
              if (!inThinkingBlock) {
                this.outputStream.send(TAGS.THINK.OPEN)
                inThinkingBlock = true
              }
              this.outputStream.send(part.text)
            } else if (part.text) {
              // Close thinking block if we were in one
              if (inThinkingBlock) {
                this.outputStream.send(TAGS.THINK.CLOSE)
                inThinkingBlock = false
              }
              // Regular response content
              this.outputStream.send(part.text)
            }
          }
        }

        // Close any open thinking block at the end
        if (inThinkingBlock) {
          this.outputStream.send(TAGS.THINK.CLOSE)
        }
      } catch (error: any) {
        const errorMessage = error?.message || String(error)
        this.outputStream.setError(new Error(`Gemini API error: ${errorMessage}`))
        throw error
      } finally {
        // Close the stream in any case
        this.outputStream.close()
      }
    }

    return {
      backgroundActions: [streamingPromise],
    }
  }

  /**
   * Add media parts (YouTube videos, images, video files) to the content array
   */
  private addMediaParts(parts: Part[]): void {
    // Build video metadata if configured
    const videoMetadata = this.buildVideoMetadata()

    // Add YouTube URLs with optional video metadata
    if (this.media.youtubeUrls && this.media.youtubeUrls.length > 0) {
      for (const url of this.media.youtubeUrls) {
        if (url && url.trim().length > 0) {
          const part: Part = {
            fileData: {
              fileUri: url.trim(),
            },
          }

          // Add video metadata if available
          if (videoMetadata && Object.keys(videoMetadata).length > 0) {
            part.videoMetadata = videoMetadata
          }

          parts.push(part)
        }
      }
    }

    // Add image URIs (GCS or data URIs)
    if (this.media.imageUris && this.media.imageUris.length > 0) {
      for (const uri of this.media.imageUris) {
        if (uri && uri.trim().length > 0) {
          parts.push({
            fileData: {
              fileUri: uri.trim(),
            },
          })
        }
      }
    }

    // Add video file URIs (GCS) with optional video metadata
    if (this.media.videoUris && this.media.videoUris.length > 0) {
      for (const uri of this.media.videoUris) {
        if (uri && uri.trim().length > 0) {
          const part: Part = {
            fileData: {
              fileUri: uri.trim(),
            },
          }

          // Add video metadata if available
          if (videoMetadata && Object.keys(videoMetadata).length > 0) {
            part.videoMetadata = videoMetadata
          }

          parts.push(part)
        }
      }
    }
  }

  /**
   * Build VideoMetadata object from media configuration
   */
  private buildVideoMetadata(): VideoMetadata | undefined {
    const metadata: VideoMetadata = {}

    // Add FPS if it's not the default value
    if (this.media.fps !== undefined && this.media.fps !== 1.0) {
      metadata.fps = this.media.fps
    }

    // Add start offset if configured
    if (this.media.videoStartOffset && this.media.videoStartOffset.trim().length > 0) {
      metadata.startOffset = this.media.videoStartOffset.trim()
    }

    // Add end offset if configured
    if (this.media.videoEndOffset && this.media.videoEndOffset.trim().length > 0) {
      metadata.endOffset = this.media.videoEndOffset.trim()
    }

    // Only return metadata if there's actual configuration
    return Object.keys(metadata).length > 0 ? metadata : undefined
  }
}

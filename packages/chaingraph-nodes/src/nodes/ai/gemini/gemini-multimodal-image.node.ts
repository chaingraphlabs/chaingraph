/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import type { Content, Part } from '@google/genai'
import {
  BaseNode,
  ExecutionEventEnum,
  ExecutionEventImpl,
  Node,
  Output,
  Passthrough,
  PortArray,
  PortObject,
} from '@badaitech/chaingraph-types'
import { GoogleGenAI } from '@google/genai'
import { NODE_CATEGORIES } from '../../../categories'
import {
  ConversationMessage,
  createImageData,
  GeminiGenerationControl,
  GeminiImageConfig,
  GeminiOutputSettings,
  ImageData,
  ImageSize,
  isGemini3ImageModel,
} from './gemini-conversation-types'

// ============================================================================
// Gemini Multimodal Image Node
// ============================================================================

/**
 * Gemini Multimodal Image Node
 *
 * Unified conversational image node supporting generation, editing, blending, and style transfer.
 *
 * USE THIS NODE FOR:
 * - Text-to-image generation
 * - Natural language image editing
 * - Multi-turn conversational refinement
 * - Image blending and composition
 * - Style transfer with reference images
 *
 * WORKFLOW:
 * Build message parts with any combination of text and images.
 * Chain outputs to inputs for iterative workflows.
 */
@Node({
  type: 'GeminiMultimodalImageNode',
  title: 'Gemini Multimodal Image',
  description: `**Multimodal image operations** — generation, editing, blending, style transfer

**Capabilities:**
- Text-to-image generation
- Image editing with natural language
- Multi-turn conversational refinement
- Image blending and composition
- Style transfer with reference images

**Input format:**
Build message parts with any combination of text and images.

Chain outputs to inputs for iterative workflows.`,
  category: NODE_CATEGORIES.GEMINI,
  tags: ['ai', 'gemini', 'image', 'multimodal', 'generation', 'editing', 'conversational', 'blending'],
})
export class GeminiMultimodalImageNode extends BaseNode {
  // ============================================================================
  // Configuration
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Configuration',
    description: `**API key and model selection**

Available models:
- \`gemini-2.5-flash-image\` — Fast editing (Nano Banana)
- \`gemini-3-pro-image-preview\` — Higher quality (Nano Banana Pro)`,
    schema: GeminiImageConfig,
    required: true,
  })
  config: GeminiImageConfig = new GeminiImageConfig()

  // ============================================================================
  // Input Message (Current user input)
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Input Message',
    description: `**Your current message to the model**

Add parts with text and/or images:
- **Text only** → Pure generation
- **Images + text** → Editing or style transfer
- **Multiple images + text** → Blending and composition

**Example parts:**
- \`[{ text: "A sunset over mountains" }]\` — Pure generation
- \`[{ inlineData: img }, { text: "Make it blue" }]\` — Edit image
- \`[{ inlineData: img1 }, { inlineData: img2 }, { text: "Blend these" }]\` — Blend images
- \`[{ inlineData: style1 }, { inlineData: style2 }, { text: "Use this style" }]\` — Style transfer`,
    schema: ConversationMessage,
    required: true,
  })
  inputMessage: ConversationMessage = new ConversationMessage()

  // ============================================================================
  // Conversation History (for multi-turn workflows)
  // ============================================================================

  @Passthrough()
  @PortArray({
    title: 'Previous Messages',
    description: `**Conversation history (optional)**

Chain from previous **Gemini Multimodal Image** outputs for:
- Context-aware generation and editing
- Multi-turn conversational refinement
- Iterative workflows

Leave empty for single-shot operations.`,
    ui: {
      collapsed: true,
    },
    itemConfig: {
      type: 'object',
      schema: ConversationMessage,
    },
    isMutable: true,
    defaultValue: [],
  })
  previousMessages: ConversationMessage[] = []

  // ============================================================================
  // Output Settings (What you get)
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Output',
    description: `**What you get** — image dimensions

Configure the generated/edited image's aspect ratio and resolution.`,
    schema: GeminiOutputSettings,
  })
  output: GeminiOutputSettings = new GeminiOutputSettings()

  // ============================================================================
  // Control (How it generates/edits)
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Control',
    description: `**How it operates** — creativity and sampling

Configure temperature, seed, and sampling parameters for fine-tuning.`,
    schema: GeminiGenerationControl,
    ui: {
      collapsed: true,
    },
  })
  control: GeminiGenerationControl = new GeminiGenerationControl()

  // ============================================================================
  // Outputs
  // ============================================================================

  @Output()
  @PortObject({
    title: 'Image Data',
    description: `**Generated or edited image**

Contains:
- \`source\` — Base64 image data
- \`mimeType\` — Image format
- \`prompt\` — Text from your input message
- \`sourceModel\` — Model used

**Chain to:** Another Gemini Multimodal Image node, Imagen Generate, or any image consumer.`,
    schema: ImageData,
  })
  imageData: ImageData = new ImageData()

  @Output()
  @PortArray({
    title: 'Messages',
    description: `**Conversation history for chaining**

Connect to another **Gemini Multimodal Image** node's "Previous Messages" input to:
- Continue multi-turn conversation
- Build context-aware workflows
- Enable iterative refinement

This preserves the full conversation history.`,
    itemConfig: {
      type: 'object',
      schema: ConversationMessage,
    },
  })
  messages: ConversationMessage[] = []

  // ============================================================================
  // Execute
  // ============================================================================

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate inputs
    if (!this.config.apiKey) {
      throw new Error('API Key is required')
    }

    // Validate inputMessage has at least one part
    if (!this.inputMessage.parts || this.inputMessage.parts.length === 0) {
      throw new Error('Input message must contain at least one part (text or image)')
    }

    // Validate 4K size is only used with Gemini 3 Pro
    if (this.output.size === ImageSize.FourK && !isGemini3ImageModel(this.config.model)) {
      throw new Error('4K resolution is only available with Gemini 3 Pro Image model')
    }

    // Decrypt the API key
    const { apiKey } = await this.config.apiKey.decrypt(context)

    // Initialize the Gemini API client
    const genAI = new GoogleGenAI({ apiKey })

    // Build conversation contents
    const contents: Content[] = []

    // 1. Add previous conversation messages if any
    if (this.previousMessages && this.previousMessages.length > 0) {
      for (const msg of this.previousMessages) {
        contents.push({
          role: msg.role,
          parts: msg.parts.map((p) => {
            if (p.inlineData) {
              return { inlineData: p.inlineData } as Part
            }
            return { text: p.text || '' } as Part
          }),
        })
      }
    }

    // 2. Process inputMessage parts - convert to API format
    const currentParts: Part[] = []

    for (const part of this.inputMessage.parts) {
      if (part.inlineData) {
        currentParts.push({
          inlineData: {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
          },
        })
      } else if (part.text) {
        currentParts.push({ text: part.text })
      }
    }

    // 3. Add current user message to contents
    contents.push({
      role: 'user',
      parts: currentParts,
    })

    // 4. Build generation config from Output/Control
    const generateConfig: any = {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: this.output.aspectRatio,
        imageSize: this.output.size,
      },
      abortSignal: context.abortSignal,
    }

    // Apply control params
    if (this.control.temperature !== undefined) {
      generateConfig.temperature = this.control.temperature
    }
    if (this.control.seed !== undefined) {
      generateConfig.seed = this.control.seed
    }
    if (this.control.topP !== undefined) {
      generateConfig.topP = this.control.topP
    }
    if (this.control.topK !== undefined) {
      generateConfig.topK = this.control.topK
    }

    // 5. Call Gemini API
    const response = await genAI.models.generateContent({
      model: this.config.model,
      contents,
      config: generateConfig,
    })

    // 6. Extract all image parts from response
    const responseParts = response.candidates?.[0]?.content?.parts || []
    const imageParts = responseParts.filter(p => p.inlineData)

    // Defensive check: warn if multiple images returned
    if (imageParts.length > 1) {
      await context.sendEvent(
        new ExecutionEventImpl(
          0,
          ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
          new Date(),
          {
            nodeId: this.id || 'unknown',
            log: `[Gemini Multimodal Image] Model returned ${imageParts.length} images. Using first image only. This may indicate unexpected model behavior.`,
          },
        ),
      )
    }

    if (imageParts.length === 0) {
      // No image found - check for error message
      const textPart = responseParts.find(p => p.text)
      if (textPart?.text) {
        throw new Error(`Image generation failed: ${textPart.text}`)
      }
      throw new Error('No image was generated in the response')
    }

    // 7. Process first image
    const part = imageParts[0]
    const outputBase64 = part.inlineData?.data || ''
    const outputMimeType = part.inlineData?.mimeType || 'image/png'

    // Set output with provenance tracking
    const textPrompt = currentParts.find(p => p.text)?.text || ''
    this.imageData = createImageData({
      base64: outputBase64,
      mimeType: outputMimeType,
      sourceModel: this.config.model,
      prompt: textPrompt,
    })

    // 8. Build updated conversation history for chaining
    this.messages = [
      ...(this.previousMessages || []),
      // Add the user's input message (use directly!)
      this.inputMessage,
      // Add the model's response
      {
        role: 'model' as const,
        parts: [
          {
            inlineData: {
              data: outputBase64,
              mimeType: outputMimeType,
            },
          },
        ],
      },
    ]

    return {}
  }
}

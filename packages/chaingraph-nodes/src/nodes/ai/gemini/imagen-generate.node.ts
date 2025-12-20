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
import type {
  GenerateImagesConfig,
} from '@google/genai'
import {
  BaseNode,
  Node,
  Output,
  Passthrough,
  PortArray,
  PortObject,
} from '@badaitech/chaingraph-types'
import {
  GoogleGenAI,
  ImagePromptLanguage as SDKImagePromptLanguage,
  PersonGeneration as SDKPersonGeneration,
  SafetyFilterLevel as SDKSafetyFilterLevel,
} from '@google/genai'
import { NODE_CATEGORIES } from '../../../categories'
import { ConversationMessage, createImageData, ImageData } from './gemini-conversation-types'
import {
  ImagenConfig,
  ImagenGenerationControl,
  ImagenOutputSettings,
  ImagenPromptInput,
  ImagePromptLanguage,
  PersonGeneration,
  SafetyFilterLevel,
} from './imagen-types'

/**
 * Maps our PersonGeneration enum to SDK's PersonGeneration enum
 */
function mapPersonGeneration(value: PersonGeneration): SDKPersonGeneration {
  switch (value) {
    case PersonGeneration.DontAllow:
      return SDKPersonGeneration.DONT_ALLOW
    case PersonGeneration.AllowAdult:
      return SDKPersonGeneration.ALLOW_ADULT
    case PersonGeneration.AllowAll:
      return SDKPersonGeneration.ALLOW_ALL
    default:
      return SDKPersonGeneration.ALLOW_ADULT
  }
}

/**
 * Maps our SafetyFilterLevel enum to SDK's SafetyFilterLevel enum
 */
function mapSafetyFilterLevel(value: SafetyFilterLevel): SDKSafetyFilterLevel {
  switch (value) {
    case SafetyFilterLevel.BlockLowAndAbove:
      return SDKSafetyFilterLevel.BLOCK_LOW_AND_ABOVE
    case SafetyFilterLevel.BlockMediumAndAbove:
      return SDKSafetyFilterLevel.BLOCK_MEDIUM_AND_ABOVE
    case SafetyFilterLevel.BlockOnlyHigh:
      return SDKSafetyFilterLevel.BLOCK_ONLY_HIGH
    case SafetyFilterLevel.BlockNone:
      return SDKSafetyFilterLevel.BLOCK_NONE
    default:
      return SDKSafetyFilterLevel.BLOCK_MEDIUM_AND_ABOVE
  }
}

/**
 * Maps our ImagePromptLanguage enum to SDK's ImagePromptLanguage enum
 */
function mapImagePromptLanguage(value: ImagePromptLanguage): SDKImagePromptLanguage {
  switch (value) {
    case ImagePromptLanguage.Auto:
      return SDKImagePromptLanguage.auto
    case ImagePromptLanguage.English:
      return SDKImagePromptLanguage.en
    case ImagePromptLanguage.Japanese:
      return SDKImagePromptLanguage.ja
    case ImagePromptLanguage.Korean:
      return SDKImagePromptLanguage.ko
    case ImagePromptLanguage.Hindi:
      return SDKImagePromptLanguage.hi
    case ImagePromptLanguage.Chinese:
      return SDKImagePromptLanguage.zh
    case ImagePromptLanguage.Portuguese:
      return SDKImagePromptLanguage.pt
    case ImagePromptLanguage.Spanish:
      return SDKImagePromptLanguage.es
    default:
      return SDKImagePromptLanguage.auto
  }
}

/**
 * Imagen Generate Node
 *
 * Fast, cost-effective text-to-image generation using Google's dedicated Imagen 4 model.
 * Best for quick image generation when you need content safety controls.
 *
 * USE THIS NODE WHEN:
 * - You want fast, cheap image generation (~$0.03/image)
 * - You need explicit control over person generation (content safety)
 * - You don't need reference images or style guidance
 * - You want consistent Imagen aesthetic style
 *
 * USE GEMINI IMAGE GENERATE INSTEAD WHEN:
 * - You need reference images for style/composition guidance
 * - You want high-fidelity text rendering in images
 * - You need 4K resolution
 *
 * Output can be chained directly to Gemini Image Edit for further refinement.
 */
@Node({
  type: 'ImagenGenerateNode',
  title: 'Imagen Generate',
  description: `**Fast & affordable** text-to-image generation using Google Imagen 4.

**Best for:**
- Quick image generation (~$0.03/image)
- Content safety with person generation controls
- Consistent Imagen aesthetic style
- **Generate multiple variations** (1-4 images per call)

**Use Gemini Image Generate instead** if you need reference images or 4K resolution.

Output chains directly to **Gemini Image Edit** for refinement.`,
  category: NODE_CATEGORIES.GEMINI,
  tags: ['ai', 'imagen', 'image', 'generation', 'text-to-image', 'google', 'fast', 'cheap', 'batch', 'multiple'],
})
export class ImagenGenerateNode extends BaseNode {
  // ============================================================================
  // Configuration
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Configuration',
    description: `**API key and model selection**

Available models:
- \`imagen-4.0-generate-001\` — Standard quality
- \`imagen-4.0-ultra-generate-001\` — Best quality
- \`imagen-4.0-fast-generate-001\` — Fastest generation`,
    schema: ImagenConfig,
    required: true,
  })
  config: ImagenConfig = new ImagenConfig()

  // ============================================================================
  // Input (What you provide)
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Input',
    description: `**What you provide** — prompt and language settings

Configure your text prompt and how it should be processed.`,
    schema: ImagenPromptInput,
    required: true,
  })
  input: ImagenPromptInput = new ImagenPromptInput()

  // ============================================================================
  // Output Settings (What you get)
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Output',
    description: `**What you get** — image dimensions and format

Configure the generated image's aspect ratio, resolution, and watermark.`,
    schema: ImagenOutputSettings,
  })
  output: ImagenOutputSettings = new ImagenOutputSettings()

  // ============================================================================
  // Control (How it generates)
  // ============================================================================

  @Passthrough()
  @PortObject({
    title: 'Control',
    description: `**How it generates** — safety filters and fine-tuning

Configure content safety, prompt adherence, and reproducibility.`,
    schema: ImagenGenerationControl,
    ui: {
      collapsed: false,
    },
  })
  control: ImagenGenerationControl = new ImagenGenerationControl()

  // ============================================================================
  // Outputs
  // ============================================================================

  @Output()
  @PortArray({
    title: 'Images',
    description: `**Generated images ready for use or further editing**

Array of images (1-4 depending on "Number of Images" setting).

Each image contains:
- \`source\` — Base64 image data
- \`mimeType\` — Image format (PNG)
- \`prompt\` — Enhanced prompt used (may differ per image)
- \`sourceModel\` — Model used for generation

**Use cases:**
- Generate 1 image → Single-item array
- Generate 4 variations → Pick the best one
- Chain to Edit, Generate, or any image consumer

**Tip:** Use array processing nodes to filter/select specific images.`,
    itemConfig: {
      type: 'object',
      schema: ImageData,
    },
  })
  images: ImageData[] = []

  @Output()
  @PortArray({
    title: 'Messages',
    description: `**Conversation history for chaining to other flows**

Connect to **Gemini Image Edit**'s "Previous Messages" input or other conversation-aware nodes.

Structure:
- User message: Original prompt
- Model message: All generated images (1-4) as inline data

This enables conversational workflows and multi-turn editing.`,
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

    if (!this.input.prompt || this.input.prompt.trim().length === 0) {
      throw new Error('Prompt is required')
    }

    // Decrypt the API key
    const { apiKey } = await this.config.apiKey.decrypt(context)

    // Initialize the Gemini API client
    const genAI = new GoogleGenAI({ apiKey })

    const outputMimeType = this.output.outputMimeType || 'image/png'
    if (outputMimeType !== 'image/png' && outputMimeType !== 'image/jpeg') {
      throw new Error('Output MIME type must be either image/png or image/jpeg')
    }

    // Build generation config from Input/Output/Control
    const generateConfig: GenerateImagesConfig = {
      numberOfImages: this.control.numberOfImages,
      // From output
      aspectRatio: this.output.aspectRatio,
      imageSize: this.output.size,
      // From control
      personGeneration: mapPersonGeneration(this.control.personGeneration),
    }

    // Generate the image using Imagen API
    const response = await genAI.models.generateImages({
      model: this.config.model,
      prompt: this.input.prompt,
      config: generateConfig,
    })

    // Extract ALL images from response
    // Note: Imagen uses imageBytes instead of data
    const generatedImages = response.generatedImages || []

    if (generatedImages.length === 0) {
      // Check for RAI (Responsible AI) filter reason
      const raiReason = (response as any).raiFilteredReason
      if (raiReason) {
        throw new Error(`Image generation blocked by safety filter: ${raiReason}`)
      }
      throw new Error('No image was generated in the response')
    }

    // Extract ALL generated images
    this.images = generatedImages.map((genImg, index) => {
      if (!genImg?.image?.imageBytes) {
        throw new Error(`Generated image ${index + 1} data is missing`)
      }

      return createImageData({
        base64: genImg.image.imageBytes,
        mimeType: outputMimeType,
        sourceModel: this.config.model,
        // Use enhanced prompt if available, otherwise original
        prompt: genImg.enhancedPrompt || this.input.prompt,
      })
    })

    // Validate we got expected number of images
    if (this.images.length !== this.control.numberOfImages) {
      console.warn(
        `Expected ${this.control.numberOfImages} images but got ${this.images.length}`,
      )
    }

    // Build conversation for chaining to other flows (e.g., Gemini Image Edit)
    // Structure: User message with prompt, Model message with all generated images
    const modelMessageParts = this.images.map(img => ({
      inlineData: {
        // TODO: upload to R2/S3 or similar and provide URL instead!
        data: img.source, // Already base64
        mimeType: img.mimeType,
      },
    }))

    this.messages = [
      {
        role: 'user',
        parts: [{ text: this.input.prompt }],
      },
      {
        role: 'model',
        parts: modelMessageParts,
      },
    ]

    return {}
  }
}

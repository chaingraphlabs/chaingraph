/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EncryptedSecretValue } from '@badaitech/chaingraph-types'
import { Buffer } from 'node:buffer'
import {
  ObjectSchema,
  PortArray,
  PortBoolean,
  PortEnumFromNative,
  PortNumber,
  PortObject,
  PortSecret,
  PortString,
} from '@badaitech/chaingraph-types'

// ============================================================================
// Gemini Image Models
// ============================================================================

/**
 * Gemini image generation model identifiers
 * These are specifically designed for image generation (Nano Banana family)
 */
export enum GeminiImageModels {
  /** Gemini 2.5 Flash Image (Nano Banana) - Fast, general-purpose */
  Gemini25FlashImage = 'gemini-2.5-flash-image',
  /** Gemini 3 Pro Image Preview (Nano Banana Pro) - Studio-quality, up to 4K */
  Gemini3ProImagePreview = 'gemini-3-pro-image-preview',
}

/**
 * Default Gemini image model
 */
export const DEFAULT_GEMINI_IMAGE_MODEL = GeminiImageModels.Gemini25FlashImage

// ============================================================================
// Image Configuration Enums
// ============================================================================

/**
 * Supported aspect ratios for image generation
 */
export enum ImageAspectRatio {
  /** 1:1 Square */
  Square = '1:1',
  /** 2:3 Portrait */
  Portrait2x3 = '2:3',
  /** 3:2 Landscape */
  Landscape3x2 = '3:2',
  /** 3:4 Portrait */
  Portrait3x4 = '3:4',
  /** 4:3 Landscape */
  Landscape4x3 = '4:3',
  /** 4:5 Portrait (Instagram) */
  Portrait4x5 = '4:5',
  /** 5:4 Landscape */
  Landscape5x4 = '5:4',
  /** 9:16 Portrait (Stories/Reels) */
  Portrait9x16 = '9:16',
  /** 16:9 Landscape (Widescreen) */
  Landscape16x9 = '16:9',
  /** 21:9 Ultrawide (Cinematic) */
  Ultrawide21x9 = '21:9',
}

/**
 * Image output size/resolution
 * Note: 4K is only available for Gemini 3 Pro Image
 */
export enum ImageSize {
  /** 1K resolution (~1024px) */
  OneK = '1K',
  /** 2K resolution (~2048px) */
  TwoK = '2K',
  /** 4K resolution (~4096px) - Gemini 3 Pro only */
  FourK = '4K',
}

// ============================================================================
// Configuration Classes
// ============================================================================

/**
 * Image metadata output schema
 * @deprecated Use ImageData instead for unified image handling
 */
@ObjectSchema({
  description: 'Metadata for generated images',
  type: 'ImageMetadata',
})
export class ImageMetadata {
  @PortString({
    title: 'MIME Type',
    description: 'Image format (e.g., image/png)',
    defaultValue: 'image/png',
  })
  mimeType: string = 'image/png'
}

// ============================================================================
// Unified Image Data Type
// ============================================================================

/**
 * Unified image data type supporting multiple input formats.
 *
 * The `source` field accepts:
 * - Raw base64 string (e.g., "iVBORw0KGgo...")
 * - Data URI (e.g., "data:image/png;base64,iVBORw...")
 * - HTTP/HTTPS URL (e.g., "https://example.com/image.png")
 *
 * URLs are automatically fetched and converted to base64 during execution.
 * This enables seamless chaining between image generation and editing nodes.
 */
@ObjectSchema({
  description: `**Unified image container** for seamless node chaining.

Supports multiple input formats:
- **URL**: \`https://example.com/image.jpg\` (auto-fetched)
- **Data URI**: \`data:image/png;base64,...\`
- **Base64**: Raw base64-encoded data

Chain this between image nodes: Generate → Edit → Edit`,
  type: 'ImageData',
})
export class ImageData {
  // === REQUIRED FIELDS ===

  @PortString({
    title: 'Source',
    description: `**Image data or URL**

Accepts:
- \`https://...\` — URL (auto-fetched during execution)
- \`data:image/png;base64,...\` — Data URI
- Raw base64 string

When chaining from other image nodes, this is populated automatically.`,
    required: true,
    ui: {
      isTextArea: true,
    },
  })
  source: string = ''

  // === AUTO-DETECTED / COMPUTED ===

  @PortString({
    title: 'MIME Type',
    description: `**Image format** (auto-detected from data)

Common values: \`image/png\`, \`image/jpeg\`, \`image/webp\``,
    defaultValue: 'image/png',
  })
  mimeType: string = 'image/png'

  // === OPTIONAL PROVENANCE ===

  @PortString({
    title: 'Source Model',
    description: `**Tracking:** Which AI model generated this image.

Populated automatically by generation nodes.`,
  })
  sourceModel?: string

  @PortString({
    title: 'Prompt',
    description: `**Tracking:** The prompt or instruction used to create/edit this image.

Useful for debugging and understanding the image history.`,
  })
  prompt?: string

  @PortNumber({
    title: 'Generated At',
    description: `**Tracking:** Unix timestamp when the image was generated.

Populated automatically by generation nodes.`,
  })
  generatedAt?: number
}

/**
 * Configuration for Gemini image generation
 */
@ObjectSchema({
  description: `**Gemini Image API Configuration**

Required for Gemini Image Generate and Gemini Image Edit nodes.`,
  type: 'GeminiImageConfig',
})
export class GeminiImageConfig {
  @PortSecret<'gemini'>({
    title: 'API Key',
    description: `**Your Google Gemini API key**

Get your API key from: [Google AI Studio](https://aistudio.google.com/apikey)`,
    secretType: 'gemini',
    required: true,
  })
  apiKey?: EncryptedSecretValue<'gemini'>

  @PortEnumFromNative(GeminiImageModels, {
    title: 'Model',
    description: `**Select the Gemini image model**

- \`gemini-2.5-flash-image\` — Fast, general-purpose
- \`gemini-3-pro-image-preview\` — Studio quality, supports 4K`,
    defaultValue: DEFAULT_GEMINI_IMAGE_MODEL,
    required: true,
  })
  model: GeminiImageModels = DEFAULT_GEMINI_IMAGE_MODEL

  // debug bool:
  @PortBoolean({
    title: 'Debug Mode',
    description: 'Enables detailed logging for debugging purposes',
    defaultValue: false,
  })
  debug: boolean = false
}

// ============================================================================
// Output/Control Classes for Gemini Multimodal Image Node
// ============================================================================

/**
 * Output settings for Gemini Multimodal Image
 * Controls image dimensions
 */
@ObjectSchema({
  description: `**Output settings** — configure the generated image properties`,
  type: 'GeminiOutputSettings',
})
export class GeminiOutputSettings {
  @PortEnumFromNative(ImageAspectRatio, {
    title: 'Aspect Ratio',
    description: `**Output image dimensions**

Common uses:
- \`1:1\` — Square (social media, icons)
- \`16:9\` — Landscape (presentations, headers)
- \`9:16\` — Portrait (stories, mobile)
- \`21:9\` — Cinematic ultrawide`,
    defaultValue: ImageAspectRatio.Square,
  })
  aspectRatio: ImageAspectRatio = ImageAspectRatio.Square

  @PortEnumFromNative(ImageSize, {
    title: 'Size',
    description: `**Output resolution**

- \`1K\` — ~1024px (faster)
- \`2K\` — ~2048px (balanced)
- \`4K\` — ~4096px (highest quality, **Gemini 3 Pro only**)`,
    defaultValue: ImageSize.TwoK,
  })
  size: ImageSize = ImageSize.TwoK
}

/**
 * Generation control for Gemini Image Generate
 * Creativity and sampling parameters
 */
@ObjectSchema({
  description: `**Generation control** — fine-tune how the image is generated`,
  type: 'GeminiGenerationControl',
})
export class GeminiGenerationControl {
  @PortNumber({
    title: 'Temperature',
    description: `**Controls randomness/creativity**

- \`0\` — Deterministic, consistent output
- \`0.5\` — Balanced (default)
- \`1.0\` — Creative, varied
- \`2.0\` — Maximum creativity

Lower values = more predictable results.`,
    defaultValue: 0.5,
    ui: {
      min: 0,
      max: 2,
      step: 0.1,
    },
  })
  temperature: number = 0.5

  @PortNumber({
    title: 'Seed',
    description: `**Random seed for reproducibility**

Combined with low temperature, produces consistent results.
Use the same seed + prompt to reproduce an output.

Range: 1 - 2147483647`,
    ui: {
      min: 1,
      max: 2147483647,
      step: 1,
    },
  })
  seed?: number

  @PortNumber({
    title: 'Top P',
    description: `**Nucleus sampling probability**

Consider tokens with cumulative probability up to this value.
- **Lower** = more focused, predictable
- **Higher** = more diverse

Default: 0.95. Range: 0-1. Leave empty for model default.`,
    ui: {
      min: 0,
      max: 1,
      step: 0.05,
    },
  })
  topP?: number

  @PortNumber({
    title: 'Top K',
    description: `**Top-K token sampling**

Number of top tokens to consider at each step.
- **Lower** = more focused (1 = greedy)
- **Higher** = more diverse

Common values: 1, 10, 40. Leave empty for model default.`,
    ui: {
      min: 1,
      max: 100,
      step: 1,
    },
  })
  topK?: number
}

// ============================================================================
// Conversation Types (for multimodal image operations)
// ============================================================================

/**
 * Inline data for small embedded media (images, etc.)
 */
@ObjectSchema({
  description: 'Inline data for small embedded media',
  type: 'InlineDataConfig',
})
export class InlineDataConfig {
  @PortString({
    title: 'Data',
    description: 'Base64-encoded data',
    defaultValue: '',
  })
  data: string = ''

  @PortString({
    title: 'MIME Type',
    description: 'Media MIME type (e.g., image/png, image/jpeg)',
    defaultValue: 'image/png',
  })
  mimeType: string = 'image/png'
}

// Legacy alias for backward compatibility
export type ConversationInlineData = InlineDataConfig

/**
 * File data for referencing external files (URLs, GCS, YouTube)
 */
@ObjectSchema({
  description: 'File reference (URL, GCS URI, YouTube)',
  type: 'FileDataConfig',
})
export class FileDataConfig {
  @PortString({
    title: 'File URI',
    description: 'URL, GCS URI (gs://bucket/file), or YouTube URL',
    required: true,
  })
  fileUri: string = ''

  @PortString({
    title: 'MIME Type',
    description: 'File MIME type (optional, auto-detected)',
  })
  mimeType?: string
}

/**
 * Function call for tool invocation
 * Matches Gemini API FunctionCall interface
 */
@ObjectSchema({
  description: 'Function/tool call with arguments',
  type: 'FunctionCallConfig',
})
export class FunctionCallConfig {
  @PortString({
    title: 'ID',
    description: 'Unique identifier for matching this call to its response (auto-generated by model)',
  })
  id?: string

  @PortString({
    title: 'Name',
    description: 'Function name to call (matches FunctionDeclaration.name)',
  })
  name?: string

  @PortObject({
    title: 'Arguments',
    description: 'Function parameters and values as JSON object',
    isSchemaMutable: true,
    schema: { type: 'object', properties: {} },
    ui: {
      keyDeletable: true,
      hideEditor: false,
    },
  })
  args: Record<string, any> = {}
}

/**
 * Function response from tool execution
 * Matches Gemini API FunctionResponse interface
 */
@ObjectSchema({
  description: 'Function/tool execution result',
  type: 'FunctionResponseConfig',
})
export class FunctionResponseConfig {
  @PortString({
    title: 'ID',
    description: 'Unique identifier matching the function call ID',
  })
  id?: string

  @PortString({
    title: 'Name',
    description: 'Function name that was called (matches FunctionDeclaration.name)',
  })
  name?: string

  @PortObject({
    title: 'Response',
    description: 'Function execution result as JSON object',
    isSchemaMutable: true,
    schema: { type: 'object', properties: {} },
    ui: {
      keyDeletable: true,
      hideEditor: false,
    },
  })
  response: Record<string, any> = {}
}

/**
 * Code execution result
 */
@ObjectSchema({
  description: 'Code execution outcome and output',
  type: 'CodeExecutionResultConfig',
})
export class CodeExecutionResultConfig {
  @PortString({
    title: 'Outcome',
    description: 'Execution outcome (e.g., OK, ERROR)',
    required: true,
  })
  outcome: string = ''

  @PortString({
    title: 'Output',
    description: 'stdout (if successful) or stderr (if failed)',
    ui: { isTextArea: true },
  })
  output?: string
}

/**
 * Executable code with language specification
 * Matches Gemini API ExecutableCode interface
 */
@ObjectSchema({
  description: 'Executable code with language specification',
  type: 'ExecutableCodeConfig',
})
export class ExecutableCodeConfig {
  @PortString({
    title: 'Code',
    description: 'Code to execute',
    ui: { isTextArea: true },
  })
  code?: string

  @PortString({
    title: 'Language',
    description: 'Programming language (PYTHON, LANGUAGE_UNSPECIFIED)',
    defaultValue: 'PYTHON',
  })
  language?: string
}

/**
 * Video metadata for video sampling configuration
 */
@ObjectSchema({
  description: 'Video sampling configuration',
  type: 'VideoMetadataConfig',
})
export class VideoMetadataConfig {
  @PortNumber({
    title: 'FPS',
    description: 'Frames per second for video sampling (0.01-24)',
    ui: {
      min: 0.01,
      max: 24,
      step: 0.1,
    },
  })
  fps?: number

  @PortString({
    title: 'Start Offset',
    description: 'Video start time (e.g., "1m30s", "90s")',
  })
  startOffset?: string

  @PortString({
    title: 'End Offset',
    description: 'Video end time (e.g., "3m45s", "225s")',
  })
  endOffset?: string
}

/**
 * Unified message part supporting all Gemini content types
 */
@ObjectSchema({
  description: 'Message part with text, media, tools, or code',
  type: 'GeminiMessagePart',
})
export class GeminiMessagePart {
  // === Content Types ===

  @PortString({
    title: 'Text',
    description: 'Text content',
    ui: { isTextArea: true },
  })
  text?: string

  @PortObject({
    title: 'Inline Data',
    description: 'Small embedded media (base64-encoded images, etc.)',
    schema: InlineDataConfig,
  })
  inlineData?: InlineDataConfig

  @PortObject({
    title: 'File Data',
    description: 'File reference (URL, GCS URI, YouTube)',
    schema: FileDataConfig,
  })
  fileData?: FileDataConfig

  // === Tool/Function Calls ===

  @PortObject({
    title: 'Function Call',
    description: 'Tool invocation with arguments',
    schema: FunctionCallConfig,
  })
  functionCall?: FunctionCallConfig

  @PortObject({
    title: 'Function Response',
    description: 'Tool execution result',
    schema: FunctionResponseConfig,
  })
  functionResponse?: FunctionResponseConfig

  // === Code Execution ===

  @PortObject({
    title: 'Executable Code',
    description: 'Code to execute with language specification',
    schema: ExecutableCodeConfig,
  })
  executableCode?: ExecutableCodeConfig

  @PortObject({
    title: 'Code Execution Result',
    description: 'Code execution outcome and output',
    schema: CodeExecutionResultConfig,
  })
  codeExecutionResult?: CodeExecutionResultConfig

  // === Metadata ===

  @PortBoolean({
    title: 'Is Thought',
    description: 'Mark this part as thinking/reasoning content',
    defaultValue: false,
  })
  thought?: boolean

  @PortString({
    title: 'Thought Signature',
    description: `**Encrypted reasoning state for multi-turn continuity**

Required by Gemini 3+ for maintaining reasoning context:
- Received in model responses during function calls
- Must be returned in subsequent requests
- Missing signatures cause 400 errors in Gemini 3 Pro

The SDK handles this automatically, but manual implementations must preserve it.`,
  })
  thoughtSignature?: string

  @PortObject({
    title: 'Video Metadata',
    description: 'Video sampling configuration (FPS, offsets)',
    schema: VideoMetadataConfig,
  })
  videoMetadata?: VideoMetadataConfig
}

// Legacy alias for backward compatibility
export type ConversationMessagePart = GeminiMessagePart

/**
 * Gemini conversation message with role and multimodal parts
 * Used across all Gemini nodes for unified message handling
 */
@ObjectSchema({
  description: 'Gemini conversation message with role and multimodal parts',
  type: 'ConversationMessage',
})
export class ConversationMessage {
  @PortString({
    title: 'Role',
    description: 'Message sender (user or model)',
    defaultValue: 'user',
  })
  role: 'user' | 'model' = 'user'

  @PortArray({
    title: 'Parts',
    description: 'Message content parts (text, media, tools, code)',
    itemConfig: {
      type: 'object',
      schema: GeminiMessagePart,
    },
    isMutable: true,
    defaultValue: [],
  })
  parts: GeminiMessagePart[] = []
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if model is Gemini 3 Pro Image (supports 4K)
 */
export function isGemini3ImageModel(model: string): boolean {
  return model.includes('gemini-3') && model.includes('image')
}

/**
 * Check if model is any Gemini image model
 */
export function isGeminiImageModel(model: string): boolean {
  return model.includes('image') && (model.includes('gemini-2.5') || model.includes('gemini-3'))
}

// ============================================================================
// ImageData Helper Types and Functions
// ============================================================================

/**
 * Source type detection result
 */
export type ImageSourceType = 'base64' | 'dataUri' | 'url'

/**
 * Resolved image data ready for API calls
 */
export interface ResolvedImageData {
  /** Base64-encoded image data (without prefix) */
  base64: string
  /** MIME type of the image */
  mimeType: string
}

/**
 * Detect the type of image source
 */
export function detectSourceType(source: string): ImageSourceType {
  const trimmed = source.trim()
  if (trimmed.startsWith('data:')) {
    return 'dataUri'
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return 'url'
  }
  return 'base64'
}

/**
 * Detect MIME type from base64 magic bytes
 */
export function detectMimeType(base64: string): string {
  // Check for common base64 magic bytes
  if (base64.startsWith('/9j/')) {
    return 'image/jpeg'
  }
  if (base64.startsWith('iVBORw')) {
    return 'image/png'
  }
  if (base64.startsWith('R0lGOD')) {
    return 'image/gif'
  }
  if (base64.startsWith('UklGR')) {
    return 'image/webp'
  }
  // Default to PNG
  return 'image/png'
}

/**
 * Parse a data URI into base64 and MIME type
 */
export function parseDataUri(dataUri: string): ResolvedImageData {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/)
  if (match) {
    return {
      mimeType: match[1],
      base64: match[2],
    }
  }
  // Fallback: strip any prefix and detect
  const commaIndex = dataUri.indexOf(',')
  const base64 = commaIndex !== -1 ? dataUri.substring(commaIndex + 1) : dataUri
  return {
    mimeType: detectMimeType(base64),
    base64,
  }
}

/**
 * Strip data URI prefix if present, return raw base64
 */
export function stripDataUriPrefix(data: string): string {
  if (data.startsWith('data:')) {
    const commaIndex = data.indexOf(',')
    if (commaIndex !== -1) {
      return data.substring(commaIndex + 1)
    }
  }
  return data
}

/**
 * Resolve ImageData to base64 format ready for API calls.
 * Handles URLs by fetching them, data URIs by parsing, and raw base64 passthrough.
 *
 * @param imageData - The ImageData object to resolve
 * @returns Resolved base64 data and MIME type
 */
export async function resolveImageData(imageData: ImageData): Promise<ResolvedImageData> {
  const source = imageData.source.trim()

  if (!source) {
    throw new Error('ImageData source is empty')
  }

  const sourceType = detectSourceType(source)

  switch (sourceType) {
    case 'dataUri': {
      return parseDataUri(source)
    }

    case 'url': {
      // Fetch the URL and convert to base64
      const response = await fetch(source)
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`)
      }
      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const contentType = response.headers.get('content-type') || 'image/png'
      // Extract just the MIME type (remove charset etc.)
      const mimeType = contentType.split(';')[0].trim()
      return { base64, mimeType }
    }

    case 'base64':
    default: {
      // Raw base64 - use provided mimeType or detect
      const mimeType = imageData.mimeType || detectMimeType(source)
      return { base64: source, mimeType }
    }
  }
}

/**
 * Create an ImageData object from base64 data with provenance
 */
export function createImageData(options: {
  base64: string
  mimeType?: string
  sourceModel?: string
  prompt?: string
}): ImageData {
  const imageData = new ImageData()
  imageData.source = options.base64
  imageData.mimeType = options.mimeType || detectMimeType(options.base64)
  imageData.sourceModel = options.sourceModel
  imageData.prompt = options.prompt
  imageData.generatedAt = Date.now()
  return imageData
}

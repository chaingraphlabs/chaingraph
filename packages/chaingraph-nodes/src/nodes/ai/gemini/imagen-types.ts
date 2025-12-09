/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EncryptedSecretValue } from '@badaitech/chaingraph-types'
import {
  ObjectSchema,
  PortBoolean,
  PortEnumFromNative,
  PortNumber,
  PortSecret,
  PortString,
} from '@badaitech/chaingraph-types'

// ============================================================================
// Imagen Models
// ============================================================================

/**
 * Google Imagen model identifiers
 * Dedicated image generation models (separate from Gemini multimodal)
 */
export enum ImagenModels {
  /** Imagen 4 Generate - Standard quality, good balance */
  Imagen4Generate = 'imagen-4.0-generate-001',
  /** Imagen 4 Ultra - Highest quality, one image at a time */
  Imagen4Ultra = 'imagen-4.0-ultra-generate-001',
  /** Imagen 4 Fast - Fastest generation, lower quality */
  Imagen4Fast = 'imagen-4.0-fast-generate-001',
  /** Imagen 3 Generate - Previous generation, stable */
  Imagen3Generate = 'imagen-3.0-generate-002',
}

/**
 * Default Imagen model
 */
export const DEFAULT_IMAGEN_MODEL = ImagenModels.Imagen4Generate

// ============================================================================
// Imagen-specific Enums
// ============================================================================

/**
 * Aspect ratios supported by Imagen models
 * Note: Imagen has a more limited set than Gemini native
 */
export enum ImagenAspectRatio {
  /** 1:1 Square */
  Square = '1:1',
  /** 3:4 Portrait */
  Portrait3x4 = '3:4',
  /** 4:3 Landscape */
  Landscape4x3 = '4:3',
  /** 9:16 Portrait (Stories/Reels) */
  Portrait9x16 = '9:16',
  /** 16:9 Landscape (Widescreen) */
  Landscape16x9 = '16:9',
}

/**
 * Image size/resolution for Imagen
 */
export enum ImagenSize {
  /** 1K resolution (~1024px) */
  OneK = '1K',
  /** 2K resolution (~2048px) */
  TwoK = '2K',
}

/**
 * Person generation control for content safety
 * Controls whether generated images can include people
 */
export enum PersonGeneration {
  /** Block generation of people entirely */
  DontAllow = 'dont_allow',
  /** Allow adult people only (default) */
  AllowAdult = 'allow_adult',
  /** Allow all people including children (restricted in EU/UK/CH/MENA) */
  AllowAll = 'allow_all',
}

/**
 * Safety filter level for image generation
 * Controls how aggressively content is filtered
 */
export enum SafetyFilterLevel {
  /** Block low confidence and above (strictest) */
  BlockLowAndAbove = 'BLOCK_LOW_AND_ABOVE',
  /** Block medium confidence and above (default) */
  BlockMediumAndAbove = 'BLOCK_MEDIUM_AND_ABOVE',
  /** Block only high confidence */
  BlockOnlyHigh = 'BLOCK_ONLY_HIGH',
  /** No blocking (least strict) */
  BlockNone = 'BLOCK_NONE',
}

/**
 * Prompt language for image generation
 * Helps the model understand non-English prompts
 */
export enum ImagePromptLanguage {
  /** Auto-detect language */
  Auto = 'auto',
  /** English */
  English = 'en',
  /** Japanese */
  Japanese = 'ja',
  /** Korean */
  Korean = 'ko',
  /** Hindi */
  Hindi = 'hi',
  /** Chinese */
  Chinese = 'zh',
  /** Portuguese */
  Portuguese = 'pt',
  /** Spanish */
  Spanish = 'es',
}

// ============================================================================
// Configuration Classes
// ============================================================================

/**
 * Configuration for Imagen image generation
 */
@ObjectSchema({
  description: `**Google Imagen API Configuration**

Required for Imagen Generate node. Uses the same API key as Gemini.`,
  type: 'ImagenConfig',
})
export class ImagenConfig {
  @PortSecret<'gemini'>({
    title: 'API Key',
    description: `**Your Google API key** (same key as Gemini)

Get your API key from: [Google AI Studio](https://aistudio.google.com/apikey)`,
    secretType: 'gemini',
    required: true,
  })
  apiKey?: EncryptedSecretValue<'gemini'>

  @PortEnumFromNative(ImagenModels, {
    title: 'Model',
    description: `**Select the Imagen model**

- \`imagen-4.0-generate-001\` — Standard (balanced)
- \`imagen-4.0-ultra-generate-001\` — Ultra (highest quality)
- \`imagen-4.0-fast-generate-001\` — Fast (quickest generation)
- \`imagen-3.0-generate-002\` — Previous generation (stable)`,
    defaultValue: DEFAULT_IMAGEN_MODEL,
    required: true,
  })
  model: ImagenModels = DEFAULT_IMAGEN_MODEL
}

// ============================================================================
// Input/Output/Control Classes for Imagen Generate Node
// ============================================================================

/**
 * Input configuration for Imagen Generate
 * Contains prompt and prompt-related settings
 */
@ObjectSchema({
  description: `**Prompt configuration** — describe what you want to generate`,
  type: 'ImagenPromptInput',
})
export class ImagenPromptInput {
  @PortString({
    title: 'Prompt',
    description: `**Describe the image you want to generate** (max 480 tokens)

Tips for better results:
- Be specific about style, lighting, and composition
- Include details like "photorealistic", "oil painting", "3D render"
- Describe the scene, subjects, and atmosphere`,
    required: true,
    ui: {
      isTextArea: true,
    },
    defaultValue: '',
  })
  prompt: string = ''

  @PortString({
    title: 'Negative Prompt',
    description: `**What to avoid in generation**

Describe elements you DON'T want in the image.
Example: "blurry, low quality, text, watermarks, distorted faces"`,
    ui: {
      isTextArea: true,
    },
  })
  negativePrompt?: string

  @PortEnumFromNative(ImagePromptLanguage, {
    title: 'Language',
    description: `**Language of your prompt text**

Helps the model understand non-English prompts better.
Use \`auto\` for automatic detection.`,
    defaultValue: ImagePromptLanguage.Auto,
  })
  language: ImagePromptLanguage = ImagePromptLanguage.Auto

  @PortBoolean({
    title: 'Enhance Prompt',
    description: `**LLM-based prompt rewriting**

When enabled, your prompt is automatically enhanced for better results.
Disable for literal prompt interpretation.

**Tip:** Disable for \`imagen-4.0-fast\` with complex prompts.`,
    defaultValue: true,
  })
  enhancePrompt: boolean = true
}

/**
 * Output settings for Imagen Generate
 * Controls image dimensions and format
 */
@ObjectSchema({
  description: `**Output settings** — configure the generated image properties`,
  type: 'ImagenOutputSettings',
})
export class ImagenOutputSettings {
  @PortEnumFromNative(ImagenAspectRatio, {
    title: 'Aspect Ratio',
    description: `**Output image dimensions**

Common uses:
- \`1:1\` — Square (social media, icons)
- \`16:9\` — Landscape (presentations, headers)
- \`9:16\` — Portrait (stories, mobile)`,
    defaultValue: ImagenAspectRatio.Square,
  })
  aspectRatio: ImagenAspectRatio = ImagenAspectRatio.Square

  @PortEnumFromNative(ImagenSize, {
    title: 'Size',
    description: `**Output resolution**

- \`1K\` — ~1024px (faster, smaller files)
- \`2K\` — ~2048px (higher quality)`,
    defaultValue: ImagenSize.TwoK,
  })
  size: ImagenSize = ImagenSize.TwoK

  @PortBoolean({
    title: 'Watermark',
    description: `**SynthID digital watermark**

Adds invisible watermark for AI-generated image detection.
**Must be OFF to use seed for reproducibility.**`,
    defaultValue: true,
  })
  watermark: boolean = true
}

/**
 * Generation control for Imagen Generate
 * Safety and fine-tuning parameters
 */
@ObjectSchema({
  description: `**Generation control** — fine-tune how the image is generated`,
  type: 'ImagenGenerationControl',
})
export class ImagenGenerationControl {
  @PortEnumFromNative(PersonGeneration, {
    title: 'Person Generation',
    description: `**Content safety control for people in images**

- \`DontAllow\` — No people generated (safest)
- \`AllowAdult\` — Adults only (recommended)
- \`AllowAll\` — All ages allowed`,
    defaultValue: PersonGeneration.AllowAdult,
  })
  personGeneration: PersonGeneration = PersonGeneration.AllowAdult

  @PortEnumFromNative(SafetyFilterLevel, {
    title: 'Safety Filter',
    description: `**Content safety strictness**

- \`BLOCK_LOW_AND_ABOVE\` — Strictest (blocks more content)
- \`BLOCK_MEDIUM_AND_ABOVE\` — Default balance
- \`BLOCK_ONLY_HIGH\` — Permissive
- \`BLOCK_NONE\` — No filtering (use responsibly)`,
    defaultValue: SafetyFilterLevel.BlockMediumAndAbove,
  })
  safetyFilter: SafetyFilterLevel = SafetyFilterLevel.BlockMediumAndAbove

  @PortNumber({
    title: 'Guidance Scale',
    description: `**Prompt adherence strength**

- **Higher** = follows prompt more strictly (may reduce quality)
- **Lower** = more creative interpretation

Typical range: 5-15. Leave empty for model default.`,
    ui: {
      min: 1,
      max: 30,
      step: 0.5,
    },
  })
  guidanceScale?: number

  @PortNumber({
    title: 'Seed',
    description: `**Random seed for reproducibility**

Use the same seed + prompt to get identical results.

**Important:** Requires "Watermark" to be OFF in Output settings.

Range: 1 - 2147483647`,
    ui: {
      min: 1,
      max: 2147483647,
      step: 1,
    },
  })
  seed?: number

  @PortNumber({
    title: 'Number of Images',
    description: `**How many images to generate**

Generate multiple variations in a single API call.
- Min: 1 (single image)
- Max: 4 (Imagen API limit)

**Tip:** Generate 4 variations and pick the best one!`,
    defaultValue: 1,
    ui: {
      min: 1,
      max: 4,
      step: 1,
    },
  })
  numberOfImages: number = 1
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if model is Imagen 4 series
 */
export function isImagen4Model(model: string): boolean {
  return model.includes('imagen-4')
}

/**
 * Check if model is Imagen Ultra (highest quality, limited to 1 image)
 */
export function isImagenUltraModel(model: string): boolean {
  return model.includes('ultra')
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EncryptedSecretValue, SecretTypeMap } from '@badaitech/chaingraph-types'
import type { GeminiModels } from './gemini-models'
import {
  ObjectSchema,
  PortArray,
  PortBoolean,
  PortEnumFromNative,
  PortEnumFromObject,
  PortNumber,
  PortSecret,
  PortString,
} from '@badaitech/chaingraph-types'
import { DEFAULT_GEMINI_MODEL, geminiModels } from './gemini-models'

/**
 * Type alias for Gemini API key secret type
 */
export type GeminiAPIKey = SecretTypeMap['gemini']['apiKey']

// ============================================================================
// Gemini 3 / 2.5 Feature Enums
// ============================================================================

/**
 * Thinking level for Gemini 3 models
 * Controls the depth of reasoning before generating a response
 */
export enum GeminiThinkingLevel {
  /** Default value (unspecified) */
  Unspecified = 'THINKING_LEVEL_UNSPECIFIED',
  /** Minimizes latency and cost for straightforward tasks */
  Low = 'LOW',
  /** Maximizes reasoning depth for complex problems (default) */
  High = 'HIGH',
}

/**
 * Media resolution control for vision processing
 * Affects quality and token cost
 */
export enum GeminiMediaResolution {
  /** Media resolution not specified */
  Unspecified = 'MEDIA_RESOLUTION_UNSPECIFIED',
  /** 64 tokens - fastest, lowest cost */
  Low = 'MEDIA_RESOLUTION_LOW',
  /** 256 tokens - balanced */
  Medium = 'MEDIA_RESOLUTION_MEDIUM',
  /** 256 tokens with zoomed reframing - highest quality */
  High = 'MEDIA_RESOLUTION_HIGH',
}

// ============================================================================
// GeminiGenerationConfig - Main LLM Configuration
// ============================================================================

/**
 * Configuration for the Google Gemini LLM
 * Following Anthropic's config pattern (apiKey first, then model, then params)
 */
@ObjectSchema({
  description: 'Configuration for the Google Gemini LLM',
  type: 'GeminiGenerationConfig',
})
export class GeminiGenerationConfig {
  @PortSecret<'gemini'>({
    title: 'API Key',
    description: 'Your Google Gemini API key',
    secretType: 'gemini',
    required: true,
  })
  apiKey?: EncryptedSecretValue<'gemini'>

  @PortEnumFromObject(geminiModels, {
    title: 'Model',
    description: 'The Gemini model to use',
    defaultValue: DEFAULT_GEMINI_MODEL,
    required: true,
  })
  model: GeminiModels = DEFAULT_GEMINI_MODEL

  @PortNumber({
    title: 'Max Output Tokens',
    description: 'Maximum number of tokens to generate',
    min: 1,
    max: 65536,
    required: true,
    integer: true,
    defaultValue: 8192,
  })
  maxOutputTokens: number = 8192

  @PortNumber({
    title: 'Temperature',
    description: 'Controls randomness (0.0 to 1.0)',
    min: 0,
    max: 1,
    step: 0.01,
    ui: {
      isSlider: true,
      leftSliderLabel: 'More deterministic',
      rightSliderLabel: 'More creative',
    },
    defaultValue: 0,
  })
  temperature: number = 0

  @PortNumber({
    title: 'Top-P',
    description: 'Nucleus sampling threshold (0.0 to 1.0)',
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: 0.95,
  })
  topP: number = 0.95

  @PortNumber({
    title: 'Top-K',
    description: 'Only sample from top K options for each token',
    min: 1,
    max: 100,
    integer: true,
    defaultValue: 40,
  })
  topK: number = 40

  @PortBoolean({
    title: 'Enable Google Search',
    description: 'Ground responses with real-time search data',
    defaultValue: false,
  })
  enableGoogleSearch: boolean = false
}

// ============================================================================
// GeminiMediaConfig - Multimodal Media Inputs
// ============================================================================

/**
 * Multimodal Media Configuration for Gemini
 * Supports YouTube videos, images, and video files from various sources
 * Video settings (fps, offsets) are flattened for single-layer constraint
 */
@ObjectSchema({
  description: 'Multimodal Media Configuration for Gemini',
  type: 'GeminiMediaConfig',
})
export class GeminiMediaConfig {
  // Media inputs
  @PortArray({
    title: 'YouTube URLs',
    description: 'YouTube video URLs (up to 10 for Gemini 2.5+)',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
    isMutable: true,
    defaultValue: [],
  })
  youtubeUrls: string[] = []

  @PortArray({
    title: 'Image URIs',
    description: 'GCS URIs (gs://...) or data URIs for images',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
    isMutable: true,
    defaultValue: [],
  })
  imageUris: string[] = []

  @PortArray({
    title: 'Video File URIs',
    description: 'GCS URIs (gs://...) for video files',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
    isMutable: true,
    defaultValue: [],
  })
  videoUris: string[] = []

  // Video analysis settings (flattened from GeminiVideoConfig)
  @PortNumber({
    title: 'Video FPS',
    description: 'Frames sampled per second (<1 for long videos, >1 for fast action)',
    min: 0.01,
    max: 24.0,
    step: 0.01,
    ui: {
      isSlider: true,
      leftSliderLabel: 'Slow sampling',
      rightSliderLabel: 'Fast sampling',
    },
    defaultValue: 1.0,
  })
  fps: number = 1.0

  @PortString({
    title: 'Video Start Offset',
    description: 'When to start analyzing (e.g., "1m30s", "45s"). Empty = beginning.',
    defaultValue: '',
  })
  videoStartOffset: string = ''

  @PortString({
    title: 'Video End Offset',
    description: 'When to stop analyzing (e.g., "3m45s", "120s"). Empty = end.',
    defaultValue: '',
  })
  videoEndOffset: string = ''

  // Media quality
  @PortEnumFromNative(GeminiMediaResolution, {
    title: 'Media Resolution',
    description: 'Vision processing quality (affects token cost)',
    defaultValue: GeminiMediaResolution.High,
  })
  mediaResolution: GeminiMediaResolution = GeminiMediaResolution.High
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper function to check if media configuration has any content
 */
export function hasMediaContent(config?: GeminiMediaConfig): boolean {
  if (!config) {
    return false
  }

  return (
    (config.youtubeUrls ? config.youtubeUrls.length > 0 : false)
    || (config.imageUris ? config.imageUris.length > 0 : false)
    || (config.videoUris ? config.videoUris.length > 0 : false)
  )
}

/**
 * Helper function to count total media items
 */
export function getMediaItemCount(config?: GeminiMediaConfig): number {
  if (!config) {
    return 0
  }

  return (
    (config.youtubeUrls?.length || 0)
    + (config.imageUris?.length || 0)
    + (config.videoUris?.length || 0)
  )
}

/**
 * Check if model is Gemini 3 series
 * Gemini 3 uses thinkingLevel parameter
 */
export function isGemini3Model(model: string): boolean {
  return model.includes('gemini-3')
}

/**
 * Check if model is Gemini 2.5 series
 * Gemini 2.5 uses thinkingBudget parameter
 */
export function isGemini25Model(model: string): boolean {
  return model.includes('gemini-2.5')
}

/**
 * Check if model supports thinking/reasoning features
 * Only Gemini 3 and 2.5 series support thinking
 */
export function supportsThinking(model: string): boolean {
  return isGemini3Model(model) || isGemini25Model(model)
}

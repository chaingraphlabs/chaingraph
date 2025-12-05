/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  ObjectSchema,
  PortNumber,
  PortString,
} from '@badaitech/chaingraph-types'

/**
 * Google Gemini model identifiers
 */
export enum GeminiModels {
  // Gemini 3 Models
  Gemini3ProPreview = 'gemini-3-pro-preview',

  // Gemini 2.5 Models
  Gemini25Pro = 'gemini-2.5-pro',
  Gemini25Flash = 'gemini-2.5-flash',
  Gemini25FlashLite = 'gemini-2.5-flash-lite',

  // Gemini 2.0 Models
  Gemini20Flash = 'gemini-2.0-flash',
  Gemini20FlashLite = 'gemini-2.0-flash-lite',

  // Latest Aliases
  GeminiFlashLatest = 'gemini-flash-latest',
  GeminiProLatest = 'gemini-pro-latest',
}

/**
 * Schema for defining a Gemini LLM Model with its parameters
 */
@ObjectSchema({
  description: 'Gemini Model Configuration',
  category: 'LLM',
  type: 'GeminiModel',
})
class GeminiModel {
  @PortString({
    title: 'Model',
    description: 'Gemini Model',
    defaultValue: GeminiModels.Gemini25Flash,
  })
  model: GeminiModels = GeminiModels.Gemini25Flash

  @PortNumber({
    title: 'Temperature',
    description: 'Temperature for sampling',
    defaultValue: 0,
  })
  temperature: number = 0

  constructor(model: GeminiModels, temperature: number) {
    this.model = model
    this.temperature = temperature
  }
}

/**
 * Object containing all available Gemini models with default configuration
 */
export const geminiModels: Record<GeminiModels, GeminiModel> = Object.fromEntries(
  Object.entries(GeminiModels).map(
    ([, m]) => [m, new GeminiModel(m, 0)],
  ),
) as Record<GeminiModels, GeminiModel>

/**
 * Default Gemini model to use
 */
export const DEFAULT_GEMINI_MODEL = GeminiModels.Gemini25Flash

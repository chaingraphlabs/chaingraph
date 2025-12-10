/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '@badaitech/chaingraph-types'
import type { Part } from '@google/genai'
import type { GeminiMessagePart } from './gemini-conversation-types'

/**
 * Supported part types for different Gemini models/use cases
 */
export enum GeminiPartTypeSupport {
  /** All part types - for general multimodal models (gemini-2.5-flash, gemini-3-pro) */
  ALL = 'ALL',
  /** Image models only - text + inlineData (gemini-2.5-flash-image, gemini-3-pro-image-preview) */
  IMAGE_ONLY = 'IMAGE_ONLY',
  /** Text models for structured output - text + fileData + functions + code (no inline images) */
  TEXT_STRUCTURED = 'TEXT_STRUCTURED',
}

/**
 * Convert GeminiMessagePart to Gemini API Part format.
 * Handles type conversions, whitelisting based on model support, and thought field validation.
 *
 * @param part - The GeminiMessagePart to convert
 * @param support - Which part types to allow (whitelist mode)
 * @param context - Optional execution context for debug logging
 * @param debugLog - Optional debug logging function
 * @returns Part for API or null if filtered out by whitelist
 */
export function convertPartToAPIFormat(
  part: GeminiMessagePart,
  support: GeminiPartTypeSupport = GeminiPartTypeSupport.ALL,
  context?: ExecutionContext,
  debugLog?: (ctx: ExecutionContext, msg: string) => Promise<void>,
): Part | null {
  const apiPart: Part = {}
  let hasValidContent = false

  // Text is always supported across all model types
  if (part.text) {
    apiPart.text = part.text
    hasValidContent = true
  }

  // InlineData (base64 images) - only for image models and ALL
  if (part.inlineData?.data) {
    if (support === GeminiPartTypeSupport.IMAGE_ONLY || support === GeminiPartTypeSupport.ALL) {
      apiPart.inlineData = {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      }
      hasValidContent = true
    }
    else if (context && debugLog) {
      debugLog(context, `[WARNING] inlineData (base64 images) not compatible with ${support} mode. Use fileData for image URLs instead.`)
    }
  }

  // FileData (URLs, GCS, YouTube) - text models and ALL
  if (part.fileData) {
    if (support === GeminiPartTypeSupport.TEXT_STRUCTURED || support === GeminiPartTypeSupport.ALL) {
      apiPart.fileData = part.fileData
      hasValidContent = true
    }
    else if (context && debugLog) {
      debugLog(context, `[WARNING] fileData not supported in ${support} mode`)
    }
  }

  // Function calling - text models and ALL
  if (part.functionCall) {
    if (support === GeminiPartTypeSupport.TEXT_STRUCTURED || support === GeminiPartTypeSupport.ALL) {
      apiPart.functionCall = {
        id: part.functionCall.id,
        name: part.functionCall.name,
        args: part.functionCall.args,
      }
      hasValidContent = true
    }
    else if (context && debugLog) {
      debugLog(context, `[WARNING] functionCall not supported in ${support} mode`)
    }
  }

  if (part.functionResponse) {
    if (support === GeminiPartTypeSupport.TEXT_STRUCTURED || support === GeminiPartTypeSupport.ALL) {
      apiPart.functionResponse = {
        id: part.functionResponse.id,
        name: part.functionResponse.name,
        response: part.functionResponse.response,
      }
      hasValidContent = true
    }
    else if (context && debugLog) {
      debugLog(context, `[WARNING] functionResponse not supported in ${support} mode`)
    }
  }

  // Executable code - text models and ALL
  if (part.executableCode) {
    if (support === GeminiPartTypeSupport.TEXT_STRUCTURED || support === GeminiPartTypeSupport.ALL) {
      apiPart.executableCode = {
        code: part.executableCode.code,
        language: part.executableCode.language as any, // API uses Language enum
      }
      hasValidContent = true
    }
    else if (context && debugLog) {
      debugLog(context, `[WARNING] executableCode not supported in ${support} mode`)
    }
  }

  if (part.codeExecutionResult) {
    if (support === GeminiPartTypeSupport.TEXT_STRUCTURED || support === GeminiPartTypeSupport.ALL) {
      apiPart.codeExecutionResult = {
        outcome: part.codeExecutionResult.outcome as any, // API uses Outcome enum
        output: part.codeExecutionResult.output,
      }
      hasValidContent = true
    }
    else if (context && debugLog) {
      debugLog(context, `[WARNING] codeExecutionResult not supported in ${support} mode`)
    }
  }

  // Video metadata - text models and ALL
  if (part.videoMetadata) {
    if (support === GeminiPartTypeSupport.TEXT_STRUCTURED || support === GeminiPartTypeSupport.ALL) {
      apiPart.videoMetadata = part.videoMetadata
      hasValidContent = true
    }
    else if (context && debugLog) {
      debugLog(context, `[WARNING] videoMetadata not supported in ${support} mode`)
    }
  }

  // CRITICAL: Only include thought if TRUE
  // Never include thought: false - causes issues with some Gemini models
  if (part.thought === true) {
    apiPart.thought = true
  }

  // Preserve thoughtSignature for multi-turn conversations (no cast needed - Part includes it)
  if (part.thoughtSignature) {
    apiPart.thoughtSignature = part.thoughtSignature
  }

  // Return null if no valid content (filtered by whitelist)
  if (!hasValidContent) {
    return null
  }

  return apiPart
}

/**
 * Convert Gemini API Part to GeminiMessagePart format.
 * Preserves ALL fields EXACTLY as returned from the API for proper multi-turn continuity.
 *
 * CRITICAL: Only copies thought if TRUE, never sets thought: false.
 * This function is identical across all Gemini nodes - no whitelisting needed on API→ChainGraph conversion.
 *
 * @param part - The API Part to convert
 * @returns GeminiMessagePart with all fields preserved
 */
export function convertAPIPartToMessagePart(part: Part): GeminiMessagePart {
  const msgPart: GeminiMessagePart = {}

  // Copy all fields EXACTLY as received from API
  if (part.text) {
    msgPart.text = part.text
  }

  if (part.inlineData) {
    msgPart.inlineData = {
      data: part.inlineData.data || '',
      mimeType: part.inlineData.mimeType || 'image/png',
    }
  }

  if (part.fileData) {
    msgPart.fileData = {
      fileUri: part.fileData.fileUri || '',
      mimeType: part.fileData.mimeType,
    }
  }

  if (part.functionCall) {
    msgPart.functionCall = {
      id: part.functionCall.id,
      name: part.functionCall.name,
      args: part.functionCall.args || {},
    }
  }

  if (part.functionResponse) {
    msgPart.functionResponse = {
      id: part.functionResponse.id,
      name: part.functionResponse.name,
      response: part.functionResponse.response || {},
    }
  }

  if (part.executableCode) {
    msgPart.executableCode = {
      code: part.executableCode.code,
      language: part.executableCode.language,
    }
  }

  if (part.codeExecutionResult) {
    msgPart.codeExecutionResult = {
      outcome: part.codeExecutionResult.outcome || '',
      output: part.codeExecutionResult.output,
    }
  }

  if (part.videoMetadata) {
    msgPart.videoMetadata = part.videoMetadata
  }

  // CRITICAL: Only copy thought if TRUE (for thought content from model)
  // This preserves the model's thinking for multi-turn continuity
  // NEVER set thought: false - leave it undefined
  if (part.thought === true) {
    msgPart.thought = true
  }

  // Preserve thoughtSignature EXACTLY (no cast needed - Part includes it)
  if (part.thoughtSignature) {
    msgPart.thoughtSignature = part.thoughtSignature
  }

  return msgPart
}

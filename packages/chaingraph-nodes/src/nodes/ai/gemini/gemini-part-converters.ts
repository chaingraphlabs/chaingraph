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
 * Fetch with timeout support using AbortController.
 * @param url - URL to fetch
 * @param timeout - Timeout in milliseconds
 * @returns Response promise
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Convert GeminiMessagePart to Gemini API Part format.
 * Handles type conversions, whitelisting based on model support, and thought field validation.
 *
 * @param part - The GeminiMessagePart to convert
 * @param support - Which part types to allow (whitelist mode)
 * @param context - Optional execution context for debug logging
 * @param debugLog - Optional debug logging function
 * @param timeout - Optional timeout for file downloads (default: 30000ms)
 * @returns Promise<Part | null> for API or null if filtered out by whitelist
 */
export async function convertPartToAPIFormat(
  part: GeminiMessagePart,
  support: GeminiPartTypeSupport = GeminiPartTypeSupport.ALL,
  context?: ExecutionContext,
  debugLog?: (ctx: ExecutionContext, msg: string) => Promise<void>,
  timeout: number = 30000,
): Promise<Part | null> {
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
    } else if (context && debugLog) {
      debugLog(context, `[WARNING] inlineData (base64 images) not compatible with ${support} mode. Use fileData for image URLs instead.`)
    }
  }

  // FileData (URLs, GCS, YouTube) - text models and ALL
  if (part.fileData) {
    if (support === GeminiPartTypeSupport.IMAGE_ONLY) {
      // Download file and convert to inlineData (base64) for IMAGE_ONLY mode
      if (context && debugLog) {
        await debugLog(context, `[INFO] Downloading fileData URL and converting to inlineData for IMAGE_ONLY mode: ${part.fileData.fileUri}`)
      }

      try {
        const response = await fetchWithTimeout(part.fileData.fileUri, timeout)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = part.fileData.mimeType || response.headers.get('content-type') || 'image/png'

        apiPart.inlineData = {
          data: base64,
          mimeType,
        }
        hasValidContent = true
      } catch (error) {
        // On error, create a text part with error message
        const errorMessage = `[ERROR] Failed to download image from URL: ${part.fileData.fileUri}\nReason: ${error instanceof Error ? error.message : String(error)}`

        if (context && debugLog) {
          await debugLog(context, errorMessage)
        }

        apiPart.text = errorMessage
        hasValidContent = true
      }
    } else if (support === GeminiPartTypeSupport.TEXT_STRUCTURED || support === GeminiPartTypeSupport.ALL) {
      apiPart.fileData = part.fileData
      hasValidContent = true
    } else if (context && debugLog) {
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
    } else if (context && debugLog) {
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
    } else if (context && debugLog) {
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
    } else if (context && debugLog) {
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
    } else if (context && debugLog) {
      debugLog(context, `[WARNING] codeExecutionResult not supported in ${support} mode`)
    }
  }

  // Video metadata - text models and ALL
  if (part.videoMetadata) {
    if (support === GeminiPartTypeSupport.TEXT_STRUCTURED || support === GeminiPartTypeSupport.ALL) {
      apiPart.videoMetadata = part.videoMetadata
      hasValidContent = true
    } else if (context && debugLog) {
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
 * Convert multiple parts to API format in parallel while maintaining order.
 * Optimized for IMAGE_ONLY mode with parallel file downloads.
 *
 * @param parts - Array of parts to convert
 * @param support - Which part types to allow (whitelist mode)
 * @param context - Optional execution context for debug logging
 * @param debugLog - Optional debug logging function
 * @param options - Optional configuration for concurrency and timeout
 * @returns Promise<Array<Part | null>> with results in same order as input
 */
export async function convertPartsToAPIFormatBatch(
  parts: GeminiMessagePart[],
  support: GeminiPartTypeSupport = GeminiPartTypeSupport.ALL,
  context?: ExecutionContext,
  debugLog?: (ctx: ExecutionContext, msg: string) => Promise<void>,
  options?: {
    maxConcurrency?: number
    timeout?: number
  },
): Promise<(Part | null)[]> {
  // Early exit for empty arrays
  if (parts.length === 0) {
    return []
  }

  const maxConcurrency = options?.maxConcurrency ?? 5
  const timeout = options?.timeout ?? 30000

  // Semaphore for concurrency control
  let activeCount = 0
  const queue: Array<() => void> = []

  const acquire = (): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (activeCount < maxConcurrency) {
        activeCount++
        resolve()
      } else {
        queue.push(resolve)
      }
    })
  }

  const release = (): void => {
    activeCount--
    const next = queue.shift()
    if (next) {
      activeCount++
      next()
    }
  }

  // Process all parts in parallel with concurrency control
  const results = await Promise.all(
    parts.map(async (part) => {
      await acquire()
      try {
        return await convertPartToAPIFormat(part, support, context, debugLog, timeout)
      } finally {
        release()
      }
    }),
  )

  return results
}

/**
 * Convert a complete message (with multiple parts) to API format.
 * Handles part batching, parallel conversion, and null filtering.
 *
 * @param message - Message with role and parts
 * @param support - Which part types to allow (whitelist mode)
 * @param context - Optional execution context for debug logging
 * @param debugLog - Optional debug logging function
 * @param options - Optional configuration for concurrency and timeout
 * @returns Promise<Content | null> with converted message or null if no valid parts
 */
export async function convertMessageToAPIFormat(
  message: { role: string; parts: GeminiMessagePart[] },
  support: GeminiPartTypeSupport = GeminiPartTypeSupport.ALL,
  context?: ExecutionContext,
  debugLog?: (ctx: ExecutionContext, msg: string) => Promise<void>,
  options?: {
    maxConcurrency?: number
    timeout?: number
  },
): Promise<{ role: string; parts: Part[] } | null> {
  // Convert all parts in batch
  const convertedParts = await convertPartsToAPIFormatBatch(
    message.parts,
    support,
    context,
    debugLog,
    options,
  )

  // Filter out nulls (preserve existing behavior)
  const validParts = convertedParts.filter((p): p is Part => p !== null)

  if (validParts.length === 0) {
    return null // Message has no valid parts
  }

  return {
    role: message.role,
    parts: validParts,
  }
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

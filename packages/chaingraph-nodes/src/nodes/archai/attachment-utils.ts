/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AttachmentInput } from './types'
import { Buffer } from 'node:buffer'

/**
 * Source type for attachment data
 */
export type AttachmentSourceType = 'dataUri' | 'url' | 'base64'

/**
 * Resolved attachment data ready for upload
 */
export interface ResolvedAttachment {
  base64: string
  mimeType: string
}

/**
 * Maximum file size: 10MB
 */
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Detect the type of attachment source from the string
 */
export function detectAttachmentSourceType(source: string): AttachmentSourceType {
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
export function detectMimeTypeFromBase64(base64: string): string {
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
  if (base64.startsWith('JVBERi')) {
    return 'application/pdf'
  }
  if (base64.startsWith('UEsDB')) {
    return 'application/zip'
  }
  if (base64.startsWith('PK')) {
    return 'application/zip'
  }
  if (base64.startsWith('Qk')) {
    return 'image/bmp'
  }
  if (base64.startsWith('SUkq') || base64.startsWith('TU0A')) {
    return 'image/tiff'
  }
  if (base64.startsWith('AAAA')) {
    // Could be MP4, MOV, etc.
    return 'video/mp4'
  }
  if (base64.startsWith('ID3') || base64.startsWith('//u')) {
    return 'audio/mpeg'
  }
  if (base64.startsWith('T2dnUw')) {
    return 'audio/ogg'
  }
  return 'application/octet-stream'
}

/**
 * Detect MIME type from filename extension
 */
export function detectMimeTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()

  const mimeMap: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',

    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // Text
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'csv': 'text/csv',
    'md': 'text/markdown',

    // Data
    'json': 'application/json',
    'xml': 'application/xml',
    'yaml': 'application/yaml',
    'yml': 'application/yaml',

    // Archives
    'zip': 'application/zip',
    'gz': 'application/gzip',
    'tar': 'application/x-tar',
    'rar': 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',

    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'm4a': 'audio/mp4',
    'flac': 'audio/flac',
    'aac': 'audio/aac',

    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',

    // Code
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'py': 'text/x-python',
    'java': 'text/x-java-source',
    'c': 'text/x-c',
    'cpp': 'text/x-c++src',
    'h': 'text/x-c',
    'hpp': 'text/x-c++hdr',
    'rs': 'text/x-rust',
    'go': 'text/x-go',
  }

  return mimeMap[ext || ''] || 'application/octet-stream'
}

/**
 * Parse a data URI into base64 and MIME type
 */
export function parseAttachmentDataUri(dataUri: string): ResolvedAttachment {
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
    mimeType: detectMimeTypeFromBase64(base64),
    base64,
  }
}

/**
 * Resolve AttachmentInput to base64 format ready for API calls.
 * Handles URLs by fetching them, data URIs by parsing, and raw base64 passthrough.
 */
export async function resolveAttachmentData(input: AttachmentInput): Promise<ResolvedAttachment> {
  const source = input.source.trim()

  if (!source) {
    throw new Error('Attachment source is empty')
  }

  const sourceType = detectAttachmentSourceType(source)

  let base64: string
  let detectedMimeType: string

  switch (sourceType) {
    case 'dataUri': {
      const parsed = parseAttachmentDataUri(source)
      base64 = parsed.base64
      detectedMimeType = parsed.mimeType
      break
    }

    case 'url': {
      const response = await fetch(source)
      if (!response.ok) {
        throw new Error(`Failed to fetch attachment from URL: ${response.status} ${response.statusText}`)
      }
      const buffer = await response.arrayBuffer()
      base64 = Buffer.from(buffer).toString('base64')
      const contentType = response.headers.get('content-type') || ''
      // Extract just the MIME type (remove charset etc.)
      detectedMimeType = contentType.split(';')[0].trim() || detectMimeTypeFromFilename(input.filename)
      break
    }

    case 'base64':
    default: {
      base64 = source
      detectedMimeType = detectMimeTypeFromBase64(source)
      break
    }
  }

  // Validate size (base64 is ~4/3 larger than original)
  const estimatedSizeBytes = (base64.length * 3) / 4
  if (estimatedSizeBytes > MAX_ATTACHMENT_SIZE_BYTES) {
    const sizeMB = (estimatedSizeBytes / 1024 / 1024).toFixed(2)
    throw new Error(`File size exceeds 10MB limit (estimated ${sizeMB}MB)`)
  }

  // Use override if provided, else fallback to detected, else use filename
  const mimeType = input.mimeType || detectedMimeType || detectMimeTypeFromFilename(input.filename)

  return { base64, mimeType }
}

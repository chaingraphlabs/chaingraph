/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ContentBlock } from '@modelcontextprotocol/sdk/types.js'
import type {
  MCPContentBlock,
} from './types'

import {
  BlobResourceContent,
  MCPAudioContent,
  MCPEmbeddedResourceContent,
  MCPImageContent,
  MCPResourceLinkContent,
  MCPTextContent,
  TextResourceContent,
} from './types'

// ============================================================================
// Template Variable Utilities
// ============================================================================

/**
 * Regular expression to match template variables with optional whitespace
 * Matches: {{var}}, {{ var }}, {{  var  }}, etc.
 */
export const TEMPLATE_VARIABLE_REGEX = /\{\{\s*(\w+)\s*\}\}/g

/**
 * Extract unique template variables from MCP server headers
 * @param headers - Array of headers with template syntax
 * @returns Map of variable names to required flags
 */
export function extractTemplateVariables(
  headers: Array<{
    key: string
    value: string
    isTemplate?: boolean
    templateRequired?: boolean
  }>,
): Map<string, boolean> {
  const variables = new Map<string, boolean>()

  for (const header of headers) {
    if (!header.isTemplate)
      continue

    const regex = new RegExp(TEMPLATE_VARIABLE_REGEX)
    let match: RegExpExecArray | null

    while ((match = regex.exec(header.value))) {
      const varName = match[1]
      const isRequired = header.templateRequired !== false

      if (variables.has(varName)) {
        variables.set(varName, variables.get(varName)! || isRequired)
      }
      else {
        variables.set(varName, isRequired)
      }
    }
  }

  return variables
}

/**
 * Resolve template variables in a string value
 * @param value - String potentially containing {{variables}}
 * @param templateValues - Map of variable names to values
 * @returns Resolved string with variables substituted
 */
export function resolveTemplateValue(
  value: string,
  templateValues: Record<string, string>,
): string {
  return value.replace(TEMPLATE_VARIABLE_REGEX, (_match, varName) => {
    const resolvedValue = templateValues[varName]
    if (resolvedValue === undefined) {
      throw new Error(`Template variable {{${varName}}} not provided`)
    }
    return resolvedValue
  })
}

/**
 * Check if a string contains template variables
 * @param value - String to check
 * @returns True if value contains {{variables}}, false otherwise
 */
export function hasTemplateVariables(value: string): boolean {
  return /\{\{\s*\w+\s*\}\}/.test(value)
}

// ============================================================================
// Content Conversion Utilities
// ============================================================================

export
function convertContentBlockToChaingraphContent(content: ContentBlock): MCPContentBlock {
  let contentResult: MCPContentBlock

  switch (content.type) {
    case 'text':
      contentResult = new MCPTextContent()
      contentResult.text = content.text || ''
      break

    case 'image':
      contentResult = new MCPImageContent()
      contentResult.data = content.data || ''
      contentResult.mimeType = content.mimeType || ''
      break

    case 'audio':
      contentResult = new MCPAudioContent()
      contentResult.data = content.data || ''
      contentResult.mimeType = content.mimeType || ''
      break

    case 'resource':
      contentResult = new MCPEmbeddedResourceContent()

      if ('blob' in content.resource && content.resource.blob) {
        contentResult.resource = new BlobResourceContent()
        contentResult.resource.blob = content.resource.blob.toString() || ''
      } else if ('text' in content.resource && content.resource.text) {
        contentResult.resource = new TextResourceContent()
        contentResult.resource.text = content.resource.text.toString() || ''
      } else {
        contentResult.resource = new TextResourceContent()
        contentResult.resource.text = ''
      }

      contentResult.resource.uri = content.resource.uri || ''
      contentResult.resource.mimeType = content.resource.mimeType || ''
      contentResult.resource._meta = content.resource._meta || undefined
      break

    case 'resource_link':
      contentResult = new MCPResourceLinkContent()
      contentResult.uri = content.uri || ''
      contentResult.name = content.name || ''
      contentResult.title = content.title || ''
      contentResult.description = content.description || ''
      contentResult.mimeType = content.mimeType || ''
      break

    default:
      contentResult = new MCPTextContent()
      contentResult.text = JSON.stringify(content) || ''
      break
  }

  contentResult._meta = content._meta || undefined

  return contentResult
}

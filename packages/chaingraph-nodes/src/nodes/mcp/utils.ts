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

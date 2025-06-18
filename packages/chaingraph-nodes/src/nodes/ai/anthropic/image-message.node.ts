/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortEnum,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { AntropicMessage, ImageBlock, TextBlock } from './types'

@Node({
  type: 'AntropicImageMessageNode',
  title: 'Anthropic Image Message',
  description: 'Creates a message with text and an image for the Anthropic API',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['anthropic', 'message', 'claude', 'image', 'vision'],
})
class AntropicImageMessageNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Text',
    description: 'The text content of the message',
    ui: {
      isTextArea: true,
    },
    required: true,
  })
  text: string = ''

  @Input()
  @PortString({
    title: 'Base64 Image',
    description: 'Base64-encoded image data (without prefixes like "data:image/jpeg;base64,")',
    ui: {
      isTextArea: true,
    },
    required: true,
  })
  imageData: string = ''

  @Input()
  @PortEnum({
    title: 'Image Type',
    description: 'MIME type of the image',
    options: [
      { id: 'image/jpeg', type: 'string', defaultValue: 'image/jpeg', title: 'JPEG' },
      { id: 'image/png', type: 'string', defaultValue: 'image/png', title: 'PNG' },
      { id: 'image/gif', type: 'string', defaultValue: 'image/gif', title: 'GIF' },
      { id: 'image/webp', type: 'string', defaultValue: 'image/webp', title: 'WebP' },
    ],
    defaultValue: 'image/jpeg',
  })
  imageType:
    'image/jpeg' |
    'image/png' |
    'image/gif' |
    'image/webp'
    = 'image/jpeg'

  @Output()
  @PortObject({
    title: 'Message',
    description: 'The created Anthropic message with image',
    schema: AntropicMessage,
  })
  message: AntropicMessage = new AntropicMessage()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Clean the base64 data in case it includes the data URL prefix
    let cleanedImageData = this.imageData
    if (cleanedImageData.includes('base64,')) {
      cleanedImageData = cleanedImageData.split('base64,')[1]
    }

    // Create a text block
    const textBlock = new TextBlock()
    textBlock.text = this.text

    // Create an image block
    const imageBlock = new ImageBlock()
    imageBlock.source.type = 'base64'
    imageBlock.source.media_type = this.imageType
    imageBlock.source.data = cleanedImageData

    // Create the message with both blocks
    this.message = new AntropicMessage()
    this.message.role = 'user' // Images can only be in user messages
    this.message.content = [imageBlock, textBlock]

    return {}
  }
}

export default AntropicImageMessageNode

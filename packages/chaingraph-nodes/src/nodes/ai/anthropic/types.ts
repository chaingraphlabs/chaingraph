/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  ObjectSchema,
  PortAny,
  PortArray,
  PortBoolean,
  PortEnum,
  PortNumber,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'

/**
 * Supported Anthropic Claude models
 */
export enum AntropicModelTypes {
  ClaudeSonnet4_5_20250929 = 'claude-sonnet-4-5-20250929',
  ClaudeSonnet4_20250514 = 'claude-sonnet-4-20250514',
  ClaudeOpus4_1_20250805 = 'claude-opus-4-1-20250805',
  ClaudeOpus4_20250514 = 'claude-opus-4-20250514',
  Claude35Sonnet20241022 = 'claude-3-5-sonnet-20241022',
  Claude37Sonnet20250219 = 'claude-3-7-sonnet-20250219',
  Claude37Opus20250213 = 'claude-3-7-opus-20250213',
  Claude37Haiku20250304 = 'claude-3-7-haiku-20250304',
  Claude3Sonnet20240229 = 'claude-3-sonnet-20240229',
  Claude3Opus20240229 = 'claude-3-opus-20240229',
  Claude3Haiku20240307 = 'claude-3-haiku-20240307',
}

/**
 * Image source configuration for image content blocks
 */
@ObjectSchema({
  description: 'Configuration for image source in image content blocks',
  type: 'ImageSource',
})
export class ImageSource {
  @PortString({
    title: 'Type',
    description: 'Type of image source (base64 or url)',
    required: true,
  })
  type: string = 'base64'

  @PortString({
    title: 'Media Type',
    description: 'MIME type of the image (e.g., image/jpeg, image/png, image/gif, image/webp)',
    required: true,
  })
  media_type: string = 'image/jpeg'

  @PortString({
    title: 'Data',
    description: 'Base64-encoded image data',
    required: true,
    ui: {
      isTextArea: true,
    },
  })
  data: string = ''

  // url
  @PortString({
    title: 'URL',
    description: 'URL of the image (if type is url)',
    required: false,
  })
  url?: string
}

/**
 * Base content block interface
 */
@ObjectSchema({
  description: 'Base content block shared by all content types',
  type: 'ContentBlockBase',
})
export class ContentBlockBase {
  @PortString({
    title: 'Type',
    description: 'Type of content block',
    required: true,
  })
  type: string = ''

  @PortNumber({
    title: 'Index',
    description: 'Index of the content block in the message',
    required: false,
  })
  index?: number
}

/**
 * Text content block
 */
@ObjectSchema({
  description: 'Text content block for messages',
  type: 'TextBlock',
})
export class TextBlock extends ContentBlockBase {
  @PortString({
    title: 'Text',
    description: 'Text content',
    required: true,
    ui: {
      isTextArea: true,
    },
  })
  text: string = ''

  constructor() {
    super()
    this.type = 'text'
  }
}

/**
 * Image content block
 */
@ObjectSchema({
  description: 'Image content block for messages',
  type: 'ImageBlock',
})
export class ImageBlock extends ContentBlockBase {
  @PortObject({
    title: 'Source',
    description: 'Image source configuration',
    schema: ImageSource,
    required: true,
  })
  source: ImageSource = new ImageSource()

  constructor() {
    super()
    this.type = 'image'
  }
}

/**
 * Tool result content block (for input)
 */
@ObjectSchema({
  description: 'Tool result content block for providing results back to the model',
  type: 'ToolResultBlock',
})
export class ToolResultBlock extends ContentBlockBase {
  @PortString({
    title: 'Tool Use ID',
    description: 'ID of the tool use this result is for',
    required: true,
  })
  tool_use_id: string = ''

  @PortString({
    title: 'Content',
    description: 'Result content from the tool execution',
    required: true,
    ui: {
      isTextArea: true,
    },
  })
  content: string = ''

  constructor() {
    super()
    this.type = 'tool_result'
  }
}

/**
 * Tool schema property
 */
@ObjectSchema({
  description: 'Property in a tool input schema',
  type: 'ToolSchemaProperty',
})
export class ToolSchemaProperty {
  @PortString({
    title: 'Type',
    description: 'JSON schema type',
    required: true,
  })
  type?: string

  @PortString({
    title: 'Title',
    description: 'Title of the property',
  })
  title?: string

  @PortString({
    title: 'Description',
    description: 'Description of the property',
  })
  description?: string

  // enum:
  @PortArray({
    title: 'Enum',
    description: 'List of allowed values for this property (if applicable)',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
    isMutable: true,
  })
  enum?: string[]

  // default
  @PortAny({
    title: 'Default',
    description: 'Default value for this property (if applicable)',
  })
  default?: string
}

/**
 * Tool input schema
 */
@ObjectSchema({
  description: 'Schema definition for tool input',
  type: 'ToolInputSchema',
})
export class ToolInputSchema {
  @PortString({
    title: 'Type',
    description: 'JSON schema type (must be "object")',
    required: true,
  })
  type: string = 'object'

  @PortObject({
    title: 'Properties',
    description: 'Schema properties',
    schema: {
      type: 'object',
      properties: {},
    },
    isSchemaMutable: true,
    required: true,
    defaultValue: {},
  })
  properties: Record<string, ToolSchemaProperty> = {}

  @PortArray({
    title: 'Required',
    description: 'List of required property names',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
    isMutable: true,
    ui: {
      addItemFormHidden: false,
    },
  })
  required: string[] = []
}

/**
 * Tool definition
 */
@ObjectSchema({
  description: 'Definition of a tool that the model may use',
  type: 'Tool',
})
export class Tool {
  @PortString({
    title: 'Name',
    description: 'Name of the tool',
    required: true,
    ui: {
      hideEditor: true,
    },
  })
  name: string = ''

  @PortString({
    title: 'Type',
    description: 'Type of the tool (optional)',
    ui: {
      hideEditor: true,
    },
  })
  type: string = 'custom'

  @PortString({
    title: 'Description',
    description: 'Detailed description of what the tool does',
    ui: {
      isTextArea: true,
      hideEditor: true,
    },
  })
  description: string = ''

  @PortObject({
    title: 'Input Schema',
    description: 'JSON schema for the tool input',
    schema: ToolInputSchema,
    required: true,
    defaultValue: new ToolInputSchema(),
    ui: {
      hideEditor: true,
    },
  })
  input_schema: ToolInputSchema = new ToolInputSchema()

  @PortString({
    title: 'Chaingraph Node ID',
    description: 'ID of the Chaingraph node that defines this tool (optional)',
    ui: {
      hideEditor: true,
    },
  })
  chaingraph_node_id?: string = undefined

  @PortString({
    title: 'Chaingraph Node Type',
    description: 'Type of the Chaingraph node that defines this tool (optional)',
    ui: {
      hideEditor: true,
    },
  })
  chaingraph_node_type?: string = undefined
}

/**
 * Tool choice type enum
 */
export enum ToolChoiceType {
  Auto = 'auto',
  Any = 'any',
  Tool = 'tool',
  None = 'none',
}

/**
 * Tool choice configuration
 */
@ObjectSchema({
  description: 'Controls how the model should use tools',
  type: 'ToolChoice',
})
export class ToolChoice {
  @PortEnum({
    title: 'Type',
    description: 'How the model should use tools',
    options: [
      { id: ToolChoiceType.Auto, type: 'string', defaultValue: ToolChoiceType.Auto, title: 'Auto (default)' },
      { id: ToolChoiceType.Any, type: 'string', defaultValue: ToolChoiceType.Any, title: 'Any (use any tool)' },
      { id: ToolChoiceType.Tool, type: 'string', defaultValue: ToolChoiceType.Tool, title: 'Tool (specific tool)' },
      { id: ToolChoiceType.None, type: 'string', defaultValue: ToolChoiceType.None, title: 'None (no tools)' },
    ],
    defaultValue: ToolChoiceType.Auto,
    required: true,
  })
  type: ToolChoiceType = ToolChoiceType.Auto

  @PortBoolean({
    title: 'Disable Parallel Tool Use',
    description: 'Whether to disable parallel tool use',
  })
  disable_parallel_tool_use: boolean = false

  @PortString({
    title: 'Tool Name',
    description: 'Name of the specific tool to use (if type is "tool")',
    required: false,
  })
  name?: string
}

/**
 * Thinking configuration
 */
@ObjectSchema({
  description: 'Configuration for Claude\'s extended thinking capability',
  type: 'ThinkingConfig',
})
export class ThinkingConfig {
  @PortEnum({
    title: 'Thinking Type',
    description: 'Whether Claude\'s extended thinking capability is enabled or disabled',
    options: [
      { id: 'enabled', type: 'string', defaultValue: 'enabled', title: 'Enabled' },
      { id: 'disabled', type: 'string', defaultValue: 'disabled', title: 'Disabled' },
    ],
    defaultValue: 'enabled',
    required: true,
  })
  type: string = 'enabled'

  @PortNumber({
    title: 'Budget Tokens',
    description: 'Number of tokens Claude can use for thinking (must be ≥1024)',
    required: true,
    min: 1024,
    defaultValue: 2048,
  })
  budget_tokens: number = 2048
}

/**
 * Message metadata
 */
@ObjectSchema({
  description: 'Metadata for the message request',
  type: 'MessageMetadata',
})
export class MessageMetadata {
  @PortString({
    title: 'User ID',
    description: 'External identifier for the user (e.g., hash or UUID)',
    ui: {
      isPassword: true,
    },
  })
  user_id?: string
}

/**
 * Input message for Anthropic API
 */
@ObjectSchema({
  description: 'A message in the conversation with Claude',
  type: 'AntropicMessage',
})
export class AntropicMessage {
  @PortEnum({
    title: 'Role',
    description: 'The role of the speaker for this message',
    options: [
      { id: 'user', type: 'string', defaultValue: 'user', title: 'User' },
      { id: 'assistant', type: 'string', defaultValue: 'assistant', title: 'Assistant' },
    ],
    defaultValue: 'user',
    required: true,
  })
  role: 'user' | 'assistant' = 'user'

  @PortArray({
    title: 'Content',
    description: 'Content blocks for the message (text, images, tool results)',
    itemConfig: {
      type: 'object',
      schema: ContentBlockBase,
    },
    required: true,
    isMutable: true,
  })
  content: ContentBlockBase[] = []
}

/**
 * Thinking content block for Claude's extended thinking
 */
@ObjectSchema({
  description: 'Thinking content block from Claude\'s extended thinking',
  type: 'ThinkingResponseBlock',
})
export class ThinkingResponseBlock extends ContentBlockBase {
  @PortString({
    title: 'Thinking',
    description: 'Thinking text content',
    required: true,
    ui: {
      isTextArea: true,
    },
  })
  thinking: string = ''

  @PortString({
    title: 'Signature',
    description: 'Signature for the thinking content',
    required: true,
  })
  signature: string = ''

  constructor() {
    super()
    this.type = 'thinking'
  }
}

/**
 * Tool use block from model responses
 */
@ObjectSchema({
  description: 'Tool use content block from Claude',
  type: 'ToolUseResponseBlock',
})
export class ToolUseResponseBlock extends ContentBlockBase {
  @PortString({
    title: 'ID',
    description: 'Unique identifier for this tool use',
    required: true,
  })
  id: string = ''

  @PortString({
    title: 'Name',
    description: 'Name of the tool being used',
    required: true,
  })
  name: string = ''

  @PortObject({
    title: 'Input',
    description: 'Input data for the tool',
    schema: {
      type: 'object',
      properties: {},
    },
    isSchemaMutable: true,
    required: true,
  })
  input: Record<string, any> = {}

  constructor() {
    super()
    this.type = 'tool_use'
  }
}

/**
 * Citation for text responses
 */
@ObjectSchema({
  description: 'Citation metadata for text responses',
  type: 'Citation',
})
export class Citation {
  @PortString({
    title: 'Type',
    description: 'Type of citation',
    required: true,
  })
  type: string = 'char_location'

  @PortString({
    title: 'Cited Text',
    description: 'The text being cited',
    required: true,
  })
  cited_text: string = ''

  @PortNumber({
    title: 'Document Index',
    description: 'Index of the document being cited',
    required: true,
  })
  document_index: number = 0

  @PortString({
    title: 'Document Title',
    description: 'Title of the document being cited',
  })
  document_title?: string

  @PortNumber({
    title: 'Start Character Index',
    description: 'Starting index of the citation in the document',
    required: true,
  })
  start_char_index: number = 0

  @PortNumber({
    title: 'End Character Index',
    description: 'Ending index of the citation in the document',
    required: true,
  })
  end_char_index: number = 0
}

/**
 * Text response block from Claude
 */
@ObjectSchema({
  description: 'Text response block from Claude',
  type: 'TextResponseBlock',
})
export class TextResponseBlock extends ContentBlockBase {
  @PortString({
    title: 'Text',
    description: 'Text content',
    required: true,
    ui: {
      isTextArea: true,
    },
  })
  text: string = ''

  @PortArray({
    title: 'Citations',
    description: 'Citations supporting the text',
    itemConfig: {
      type: 'object',
      schema: Citation,
    },
  })
  citations?: Citation[]

  constructor() {
    super()
    this.type = 'text'
  }
}

/**
 * Response content from Claude (union of possible response block types)
 */
@ObjectSchema({
  description: 'Response content from Claude',
  type: 'AntropicResponseContent',
})
export class AntropicResponseContent {
  @PortArray({
    title: 'Text Blocks',
    description: 'Text content blocks from Claude',
    itemConfig: {
      type: 'object',
      schema: TextResponseBlock,
    },
  })
  textBlocks: TextResponseBlock[] = []

  @PortArray({
    title: 'Thinking Blocks',
    description: 'Thinking content blocks from Claude',
    itemConfig: {
      type: 'object',
      schema: ThinkingResponseBlock,
    },
  })
  thinkingBlocks: ThinkingResponseBlock[] = []

  @PortArray({
    title: 'Tool Use Blocks',
    description: 'Tool use blocks from Claude',
    itemConfig: {
      type: 'object',
      schema: ToolUseResponseBlock,
    },
  })
  toolUseBlocks: ToolUseResponseBlock[] = []
}

/**
 * Information about Claude's token usage
 */
@ObjectSchema({
  description: 'Token usage information',
  type: 'TokenUsage',
})
export class TokenUsage {
  @PortNumber({
    title: 'Input Tokens',
    description: 'Number of input tokens used',
    required: true,
  })
  input_tokens: number = 0

  @PortNumber({
    title: 'Output Tokens',
    description: 'Number of output tokens generated',
    required: true,
  })
  output_tokens: number = 0
}

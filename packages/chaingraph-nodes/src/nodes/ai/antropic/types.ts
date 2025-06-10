/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  Boolean,
  Number,
  ObjectSchema,
  PortAny,
  PortArray,
  PortEnum,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'

/**
 * Supported Anthropic Claude models
 */
export enum AntropicModelTypes {
  ClaudeSonnet4_20250514 = 'claude-sonnet-4-20250514',
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
})
export class ImageSource {
  @String({
    title: 'Type',
    description: 'Type of image source (base64 or url)',
    required: true,
  })
  type: string = 'base64'

  @String({
    title: 'Media Type',
    description: 'MIME type of the image (e.g., image/jpeg, image/png, image/gif, image/webp)',
    required: true,
  })
  media_type: string = 'image/jpeg'

  @String({
    title: 'Data',
    description: 'Base64-encoded image data',
    required: true,
    ui: {
      isTextArea: true,
    },
  })
  data: string = ''

  // url
  @String({
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
})
export class ContentBlockBase {
  @String({
    title: 'Type',
    description: 'Type of content block',
    required: true,
  })
  type: string = ''

  @Number({
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
})
export class TextBlock extends ContentBlockBase {
  @String({
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
})
export class ToolResultBlock extends ContentBlockBase {
  @String({
    title: 'Tool Use ID',
    description: 'ID of the tool use this result is for',
    required: true,
  })
  tool_use_id: string = ''

  @String({
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
})
export class ToolSchemaProperty {
  @String({
    title: 'Type',
    description: 'JSON schema type',
    required: true,
  })
  type?: string

  @String({
    title: 'Title',
    description: 'Title of the property',
  })
  title?: string

  @String({
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
})
export class ToolInputSchema {
  @String({
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
})
export class Tool {
  @String({
    title: 'Name',
    description: 'Name of the tool',
    required: true,
  })
  name: string = ''

  @String({
    title: 'Type',
    description: 'Type of the tool (optional)',
  })
  type: string = 'custom'

  @String({
    title: 'Description',
    description: 'Detailed description of what the tool does',
    ui: {
      isTextArea: true,
    },
  })
  description: string = ''

  @PortObject({
    title: 'Input Schema',
    description: 'JSON schema for the tool input',
    schema: ToolInputSchema,
    required: true,
    defaultValue: new ToolInputSchema(),
  })
  input_schema: ToolInputSchema = new ToolInputSchema()

  @String({
    title: 'Chaingraph Node ID',
    description: 'ID of the Chaingraph node that defines this tool (optional)',
  })
  chaingraph_node_id?: string = undefined

  @String({
    title: 'Chaingraph Node Type',
    description: 'Type of the Chaingraph node that defines this tool (optional)',
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

  @Boolean({
    title: 'Disable Parallel Tool Use',
    description: 'Whether to disable parallel tool use',
  })
  disable_parallel_tool_use: boolean = false
}

/**
 * Thinking configuration
 */
@ObjectSchema({
  description: 'Configuration for Claude\'s extended thinking capability',
})
export class ThinkingConfig {
  @String({
    title: 'Type',
    description: 'Type of thinking configuration ("enabled" or "disabled")',
    required: true,
    defaultValue: 'enabled',
  })
  type: string = 'enabled'

  @Number({
    title: 'Budget Tokens',
    description: 'Number of tokens Claude can use for thinking (must be ≥1024)',
    required: true,
    min: 1024,
  })
  budget_tokens: number = 2048
}

/**
 * Message metadata
 */
@ObjectSchema({
  description: 'Metadata for the message request',
})
export class MessageMetadata {
  @String({
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
  })
  content: ContentBlockBase[] = []
}

/**
 * Main configuration for the Anthropic API request
 */
@ObjectSchema({
  description: 'Configuration for the Anthropic Claude API request',
})
export class AntropicConfig {
  @String({
    title: 'API Key',
    description: 'Your Anthropic API key',
    required: true,
    ui: {
      isPassword: true,
    },
  })
  apiKey: string = ''

  @PortEnum({
    title: 'Model',
    description: 'The Claude model to use',
    options: [
      { id: AntropicModelTypes.ClaudeSonnet4_20250514, type: 'string', defaultValue: AntropicModelTypes.ClaudeSonnet4_20250514, title: 'Claude Sonnet 4 (2025-05-14)' },
      { id: AntropicModelTypes.ClaudeOpus4_20250514, type: 'string', defaultValue: AntropicModelTypes.ClaudeOpus4_20250514, title: 'Claude Opus 4 (2025-05-14)' },
      { id: AntropicModelTypes.Claude37Sonnet20250219, type: 'string', defaultValue: AntropicModelTypes.Claude37Sonnet20250219, title: 'Claude 3.7 Sonnet (2025-02-19)' },
      { id: AntropicModelTypes.Claude37Opus20250213, type: 'string', defaultValue: AntropicModelTypes.Claude37Opus20250213, title: 'Claude 3.7 Opus (2025-02-13)' },
      { id: AntropicModelTypes.Claude37Haiku20250304, type: 'string', defaultValue: AntropicModelTypes.Claude37Haiku20250304, title: 'Claude 3.7 Haiku (2025-03-04)' },
      { id: AntropicModelTypes.Claude35Sonnet20241022, type: 'string', defaultValue: AntropicModelTypes.Claude35Sonnet20241022, title: 'Claude 3.5 Sonnet (2024-10-22)' },
      { id: AntropicModelTypes.Claude3Sonnet20240229, type: 'string', defaultValue: AntropicModelTypes.Claude3Sonnet20240229, title: 'Claude 3 Sonnet (2024-02-29)' },
      { id: AntropicModelTypes.Claude3Opus20240229, type: 'string', defaultValue: AntropicModelTypes.Claude3Opus20240229, title: 'Claude 3 Opus (2024-02-29)' },
      { id: AntropicModelTypes.Claude3Haiku20240307, type: 'string', defaultValue: AntropicModelTypes.Claude3Haiku20240307, title: 'Claude 3 Haiku (2024-03-07)' },
    ],
    defaultValue: AntropicModelTypes.ClaudeSonnet4_20250514,
    required: true,
  })
  model: AntropicModelTypes = AntropicModelTypes.ClaudeSonnet4_20250514

  @Number({
    title: 'Max Tokens',
    description: 'Maximum number of tokens to generate',
    min: 1,
    required: true,
  })
  max_tokens: number = 1024

  @Number({
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
  })
  temperature: number = 0.7

  @Number({
    title: 'Top P',
    description: 'Controls diversity via nucleus sampling (0.0 to 1.0)',
    min: 0,
    max: 1,
    step: 0.01,
  })
  top_p?: number

  @Number({
    title: 'Top K',
    description: 'Only sample from top K options for each token',
    min: 1,
  })
  top_k?: number

  @PortArray({
    title: 'Stop Sequences',
    description: 'Custom sequences that will stop generation',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  stop_sequences?: string[]

  @String({
    title: 'System',
    description: 'System prompt providing context and instructions to Claude',
    ui: {
      isTextArea: true,
      textareaDimensions: { height: 150 },
    },
  })
  system?: string

  @PortObject({
    title: 'Metadata',
    description: 'Additional metadata for the request',
    schema: MessageMetadata,
    defaultValue: new MessageMetadata(),
  })
  metadata?: MessageMetadata

  @PortObject({
    title: 'Thinking',
    description: 'Configuration for Claude\'s extended thinking capability',
    schema: ThinkingConfig,
    defaultValue: new ThinkingConfig(),
  })
  thinking?: ThinkingConfig

  @PortArray({
    title: 'Tools',
    description: 'Definitions of tools that the model may use',
    itemConfig: {
      type: 'object',
      schema: Tool,
    },
    defaultValue: [],
  })
  tools?: Tool[]

  @PortObject({
    title: 'Tool Choice',
    description: 'Controls how the model should use tools',
    schema: ToolChoice,
    defaultValue: new ToolChoice(),
  })
  tool_choice?: ToolChoice

  @Boolean({
    title: 'Stream',
    description: 'Whether to stream the response incrementally',
  })
  stream: boolean = true
}

/**
 * Thinking content block for Claude's extended thinking
 */
@ObjectSchema({
  description: 'Thinking content block from Claude\'s extended thinking',
})
export class ThinkingResponseBlock extends ContentBlockBase {
  @String({
    title: 'Thinking',
    description: 'Thinking text content',
    required: true,
    ui: {
      isTextArea: true,
    },
  })
  thinking: string = ''

  @String({
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
})
export class ToolUseResponseBlock extends ContentBlockBase {
  @String({
    title: 'ID',
    description: 'Unique identifier for this tool use',
    required: true,
  })
  id: string = ''

  @String({
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
})
export class Citation {
  @String({
    title: 'Type',
    description: 'Type of citation',
    required: true,
  })
  type: string = 'char_location'

  @String({
    title: 'Cited Text',
    description: 'The text being cited',
    required: true,
  })
  cited_text: string = ''

  @Number({
    title: 'Document Index',
    description: 'Index of the document being cited',
    required: true,
  })
  document_index: number = 0

  @String({
    title: 'Document Title',
    description: 'Title of the document being cited',
  })
  document_title?: string

  @Number({
    title: 'Start Character Index',
    description: 'Starting index of the citation in the document',
    required: true,
  })
  start_char_index: number = 0

  @Number({
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
})
export class TextResponseBlock extends ContentBlockBase {
  @String({
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
})
export class TokenUsage {
  @Number({
    title: 'Input Tokens',
    description: 'Number of input tokens used',
    required: true,
  })
  input_tokens: number = 0

  @Number({
    title: 'Output Tokens',
    description: 'Number of output tokens generated',
    required: true,
  })
  output_tokens: number = 0
}

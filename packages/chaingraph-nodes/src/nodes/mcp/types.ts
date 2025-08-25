/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EncryptedSecretValue } from '@badaitech/chaingraph-types'
import { PortEnum } from '@badaitech/chaingraph-types'
import {

  ObjectSchema,
  PortArray,
  PortBoolean,
  PortNumber,
  PortObject,
  PortSecret,
  PortString,
} from '@badaitech/chaingraph-types'

// Re-export relevant MCP types from the SDK
export type {
  ClientCapabilities,
  ContentBlock,
  ImageContent,
  JSONRPCMessage,
  ProgressToken,
  PromptMessage,
  ResourceContents,
  SamplingMessage,
  ServerCapabilities,
  TextContent,
  // Tool,
} from '@modelcontextprotocol/sdk/types.js'

// MCP Client Info Schema
@ObjectSchema({
  description: 'MCP Client Implementation Information',
})
export class MCPClientInfo {
  @PortString({
    title: 'Name',
    description: 'Client implementation name',
    defaultValue: 'chaingraph-mcp-client',
  })
  name: string = 'chaingraph-mcp-client'

  @PortString({
    title: 'Version',
    description: 'Client implementation version',
    defaultValue: '0.0.0',
  })
  version: string = '0.0.0'

  @PortString({
    title: 'Title',
    description: 'Human-readable client title',
    defaultValue: 'Chaingraph MCP Client',
  })
  title: string = ''
}

// Authentication Schemas
@ObjectSchema({
  description: 'API Key Authentication',
})
export class MCPApiKeyAuth {
  @PortSecret<'string'>({
    title: 'API Key',
    description: 'API Key for authentication',
    secretType: 'string',
    required: true,
  })
  apiKey?: EncryptedSecretValue<'string'>

  @PortString({
    title: 'Header Name',
    description: 'HTTP header name for the API key',
    defaultValue: 'Authorization',
  })
  headerName: string = 'Authorization'

  @PortString({
    title: 'Header Prefix',
    description: 'Prefix for the header value (e.g., "Bearer")',
    defaultValue: 'Bearer',
  })
  headerPrefix: string = 'Bearer'
}

@ObjectSchema({
  description: 'Custom Header Authentication',
})
export class HeaderPair {
  @PortString({
    title: 'Header Name',
    description: 'HTTP header name',
  })
  key: string = ''

  @PortString({
    title: 'Header Value',
    description: 'HTTP header value',
  })
  value?: string = ''
}

@ObjectSchema({
  description: 'MCP Connection Data',
})
export class MCPConnectionData {
  @PortString({
    title: 'Server URL',
    description: 'MCP server SSE endpoint URL (e.g., https://api.example.com/mcp)',
    required: true,
    ui: {
      placeholder: 'https://api.example.com/mcp',
    },
  })
  serverUrl: string = ''

  @PortArray({
    title: 'Headers',
    description: 'Custom HTTP headers for authentication',
    itemConfig: {
      type: 'object',
      schema: HeaderPair,
    },
    defaultValue: [],
    ui: {
      hideEditor: false,
      addItemFormHidden: false,
      itemDeletable: true,
    },
    isMutable: true,
  })
  headers: HeaderPair[] = []
}

// @ObjectSchema({
//   description: 'Custom Headers Authentication',
// })
// export class MCPHeaders {
//   @PortArray({
//     title: 'Headers',
//     description: 'Custom HTTP headers for authentication',
//     itemConfig: {
//       type: 'object',
//       schema: HeaderPair,
//     },
//     defaultValue: [],
//   })
//   headers: HeaderPair[] = []
// }

// Union type for authentication
// export type MCPAuthCredentials = MCPApiKeyAuth | MCPHeaders

// Server Capabilities Schema
@ObjectSchema({
  description: 'MCP Server Capabilities',
})
export class MCPServerCapabilities {
  @PortBoolean({
    title: 'Tools',
    description: 'Server supports tool invocation',
    defaultValue: false,
  })
  tools: boolean = false

  @PortBoolean({
    title: 'Resources',
    description: 'Server supports resource reading',
    defaultValue: false,
  })
  resources: boolean = false

  @PortBoolean({
    title: 'Prompts',
    description: 'Server supports prompt templates',
    defaultValue: false,
  })
  prompts: boolean = false

  @PortBoolean({
    title: 'Logging',
    description: 'Server supports logging',
    defaultValue: false,
  })
  logging: boolean = false

  @PortBoolean({
    title: 'Completions',
    description: 'Server supports argument completions',
    defaultValue: false,
  })
  completions: boolean = false

  @PortObject({
    title: 'Raw Capabilities',
    description: 'Raw server capabilities object',
    schema: { properties: {} },
  })
  raw: Record<string, any> = {}
}

// Tool Definition Schema
@ObjectSchema({
  description: 'MCP Tool Definition',
})
export class MCPToolDefinition {
  @PortString({
    title: 'Name',
    description: 'Tool name',
  })
  name: string = ''

  @PortString({
    title: 'Title',
    description: 'Human-readable tool title',
  })
  title?: string

  @PortString({
    title: 'Description',
    description: 'Tool description',
  })
  description?: string

  @PortObject({
    title: 'Input Schema',
    description: 'JSON Schema for tool arguments',
    schema: { properties: {} },
  })
  inputSchema: Record<string, any> = { type: 'object', properties: {} }

  @PortObject({
    title: 'Output Schema',
    description: 'JSON Schema for tool output',
    schema: { properties: {} },
  })
  outputSchema?: Record<string, any>
}

// Content Block Schemas
@ObjectSchema({
  description: 'Text Content Block',
})
export class MCPTextContent {
  @PortString({
    title: 'Type',
    description: 'Content type',
    defaultValue: 'text',
  })
  type = 'text' as const

  @PortString({
    title: 'Text',
    description: 'Text content',
  })
  text: string = ''

  @PortObject({
    title: 'Metadata',
    description: 'Additional metadata for the content block',
    schema: { properties: {} },
  })
  _meta?: Record<string, any>
}

@ObjectSchema({
  description: 'Image Content Block',
})
export class MCPImageContent {
  @PortString({
    title: 'Type',
    description: 'Content type',
    defaultValue: 'image',
  })
  type = 'image' as const

  @PortString({
    title: 'Data',
    description: 'Base64-encoded image data',
  })
  data: string = ''

  @PortString({
    title: 'MIME Type',
    description: 'Image MIME type',
  })
  mimeType: string = ''

  @PortObject({
    title: 'Metadata',
    description: 'Additional metadata for the content block',
    schema: { properties: {} },
  })
  _meta?: Record<string, any>
}

@ObjectSchema({
  description: 'Audio Content Block',
})
export class MCPAudioContent {
  @PortString({
    title: 'Type',
    description: 'Content type',
    defaultValue: 'audio',
  })
  type = 'audio' as const

  @PortString({
    title: 'Data',
    description: 'Base64-encoded audio data',
  })
  data: string = ''

  @PortString({
    title: 'MIME Type',
    description: 'Image MIME type',
  })
  mimeType: string = ''

  @PortObject({
    title: 'Metadata',
    description: 'Additional metadata for the content block',
    schema: { properties: {} },
  })
  _meta?: Record<string, any>
}

@ObjectSchema({
  description: 'Text Resource Contents',
})
export class TextResourceContent {
  @PortString({
    title: 'URI',
    description: 'Resource URI',
  })
  uri: string = ''

  @PortString({
    title: 'MIME Type',
    description: 'Resource MIME type',
  })
  mimeType: string = ''

  @PortString({
    title: 'Text',
    description: 'Text content of the resource (if applicable)',
  })
  text: string = ''

  @PortObject({
    title: 'Metadata',
    description: 'Additional metadata for the resource',
    schema: { properties: {} },
  })
  _meta?: Record<string, any>
}

@ObjectSchema({
  description: 'Blob Resource Contents',
})
export class BlobResourceContent {
  @PortString({
    title: 'URI',
    description: 'Resource URI',
  })
  uri: string = ''

  @PortString({
    title: 'MIME Type',
    description: 'Resource MIME type',
  })
  mimeType: string = ''

  @PortString({
    title: 'Blob',
    description: 'Base64-encoded resource data',
  })
  blob: string = ''

  @PortObject({
    title: 'Metadata',
    description: 'Additional metadata for the resource',
    schema: { properties: {} },
  })
  _meta?: Record<string, any>
}

@ObjectSchema({
  description: 'Embedded Resource Content Block',
})
export class MCPEmbeddedResourceContent {
  @PortString({
    title: 'Type',
    description: 'Content type',
    defaultValue: 'resource',
  })
  type = 'resource' as const

  @PortObject({
    title: 'Resource',
    description: 'Embedded resource contents',
    schema: TextResourceContent, // Should be a more specific schema based on resource type
  })
  resource: TextResourceContent | BlobResourceContent = new TextResourceContent()

  @PortObject({
    title: 'Metadata',
    description: 'Additional metadata for the content block',
    schema: { properties: {} },
  })
  _meta?: Record<string, any>
}

@ObjectSchema({
  description: 'Resource Link Content Block',
})
export class MCPResourceLinkContent {
  @PortString({
    title: 'Type',
    description: 'Content type',
    defaultValue: 'resource_link',
  })
  type = 'resource_link' as const

  @PortString({
    title: 'URI',
    description: 'Resource URI',
  })
  uri: string = ''

  @PortString({
    title: 'Name',
    description: 'Resource name',
  })
  name?: string

  @PortString({
    title: 'Title',
    description: 'Resource title',
  })
  title?: string

  @PortString({
    title: 'Description',
    description: 'Resource description',
  })
  description?: string

  @PortString({
    title: 'MIME Type',
    description: 'Resource MIME type',
  })
  mimeType?: string

  @PortObject({
    title: 'Metadata',
    description: 'Additional metadata for the content block',
    schema: { properties: {} },
  })
  _meta?: Record<string, any>
}

export type MCPContentBlock =
  MCPTextContent |
  MCPImageContent |
  MCPAudioContent |
  MCPEmbeddedResourceContent |
  MCPResourceLinkContent

// Fields for MCP progress messages
// progress
// total
// message
@ObjectSchema({
  description: 'MCP Progress Message',
})
export class MCPProgressMessage {
  @PortNumber({
    title: 'Progress',
    description: 'Current progress',
    defaultValue: 0,
  })
  progress: number = 0

  @PortString({
    title: 'Message',
    description: 'Progress message text',
  })
  message?: string

  @PortNumber({
    title: 'Total',
    description: 'Total amount of work to be done',
  })
  total?: number
}

@ObjectSchema({
  description: 'MCP Prompt Message',
})
export class MCPPromptMessage {
  @PortEnum({
    title: 'Role',
    description: 'Role of the message sender',
    options: [
      { id: 'user', type: 'string', defaultValue: 'user', title: 'User' },
      { id: 'assistant', type: 'string', defaultValue: 'assistant', title: 'Assistant' },
    ],
    defaultValue: 'user',
    required: true,
  })
  role: 'user' | 'assistant' = 'user'

  // content
  @PortObject({
    title: 'Content',
    description: 'Content of the message',
    schema: MCPTextContent, // Simplified for now
  })
  content: MCPContentBlock = new MCPTextContent()
}

@ObjectSchema({
  description: 'MCP Prompt Result',
})
export class MCPPromptResult {
  @PortString({
    title: 'Description',
    description: 'Prompt description',
    defaultValue: '',
  })
  description: string = ''

  // messages:
  @PortArray({
    title: 'Messages',
    description: 'Messages generated by the prompt',
    itemConfig: {
      type: 'object',
      schema: MCPPromptMessage, // Simplified for now
    },
    defaultValue: [],
  })
  messages: Array<MCPPromptMessage> = []
}

// ReadResourceResult

@ObjectSchema({
  description: 'MCP Read Resource Result',
})
export class MCPReadResourceResult {
  @PortArray({
    title: 'Contents',
    description: 'Content blocks of the resource',
    itemConfig: {
      type: 'object',
      schema: TextResourceContent,
    },
  })
  contents: (TextResourceContent | BlobResourceContent)[] = []

  @PortObject({
    title: 'Metadata',
    description: 'Additional metadata for the content block',
    schema: { properties: {} },
  })
  _meta?: Record<string, any>
}

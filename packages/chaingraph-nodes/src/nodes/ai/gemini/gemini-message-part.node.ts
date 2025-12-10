/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Node,
  Output,
  Passthrough,
  PortBoolean,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import {
  CodeExecutionResultConfig,
  ExecutableCodeConfig,
  FileDataConfig,
  FunctionCallConfig,
  FunctionResponseConfig,
  GeminiMessagePart,
  InlineDataConfig,
  VideoMetadataConfig,
} from './gemini-conversation-types'

/**
 * Gemini Message Part Builder Node
 *
 * Builds a single message part with one content type.
 * Used with Array Add to build parts array for messages.
 *
 * WORKFLOW:
 * 1. Choose ONE content type (text, inlineData, fileData, etc.)
 * 2. Configure that type's properties
 * 3. Output part to Array Add → build parts array
 * 4. Use parts array in Gemini Message node
 */
@Node({
  type: 'GeminiMessagePartNode',
  title: 'Gemini Message Part',
  description: `**Build a message part**

Create a single part with ONE of these types:
- **Text** - Plain text content
- **Inline Data** - Base64-encoded media
- **File Data** - URLs, GCS, YouTube
- **Function Call** - Tool invocation
- **Function Response** - Tool result
- **Executable Code** - Code to run
- **Code Result** - Execution output

Use with Array Add to build parts arrays.`,
  category: NODE_CATEGORIES.GEMINI,
  tags: ['gemini', 'message', 'part', 'builder', 'helper'],
})
export class GeminiMessagePartNode extends BaseNode {
  // === Content Types ===

  @Passthrough()
  @PortString({
    title: 'Text',
    description: `**Plain text content**

For messages, prompts, or instructions.`,
    ui: { isTextArea: true },
  })
  text?: string

  @Passthrough()
  @PortObject({
    title: 'Inline Data',
    description: `**Base64-encoded media**

Small embedded content (images, etc.).
Use fileData for URLs instead.`,
    schema: InlineDataConfig,
  })
  inlineData?: InlineDataConfig

  @Passthrough()
  @PortObject({
    title: 'File Data',
    description: `**File reference**

Accepts:
- HTTP/HTTPS URLs
- GCS URIs: \`gs://bucket/file\`
- YouTube URLs`,
    schema: FileDataConfig,
  })
  fileData?: FileDataConfig

  // === Tool/Function Calls ===

  @Passthrough()
  @PortObject({
    title: 'Function Call',
    description: `**Tool invocation**

Call a function with arguments.`,
    schema: FunctionCallConfig,
  })
  functionCall?: FunctionCallConfig

  @Passthrough()
  @PortObject({
    title: 'Function Response',
    description: `**Tool execution result**

Response from a function call.`,
    schema: FunctionResponseConfig,
  })
  functionResponse?: FunctionResponseConfig

  // === Code Execution ===

  @Passthrough()
  @PortObject({
    title: 'Executable Code',
    description: `**Code to execute with language specification**

Code for Gemini to run (default: Python).`,
    schema: ExecutableCodeConfig,
  })
  executableCode?: ExecutableCodeConfig

  @Passthrough()
  @PortObject({
    title: 'Code Execution Result',
    description: `**Code execution output**

Result from running code.`,
    schema: CodeExecutionResultConfig,
  })
  codeExecutionResult?: CodeExecutionResultConfig

  // === Metadata ===

  @Passthrough()
  @PortBoolean({
    title: 'Is Thought',
    description: `**Mark as thinking content**

When true, this part contains reasoning/thinking.`,
    defaultValue: false,
  })
  thought?: boolean

  @Passthrough()
  @PortString({
    title: 'Thought Signature',
    description: `**Encrypted reasoning state (Gemini 3+)**

Required for multi-turn reasoning continuity:
- Received from model during function calls
- Must be returned in subsequent requests
- Missing signatures cause 400 errors in Gemini 3 Pro`,
  })
  thoughtSignature?: string

  @Passthrough()
  @PortObject({
    title: 'Video Metadata',
    description: `**Video sampling configuration**

Configure FPS and time offsets for video processing.`,
    schema: VideoMetadataConfig,
  })
  videoMetadata?: VideoMetadataConfig

  @Output()
  @PortObject({
    title: 'Part',
    description: `**Built message part**

Use with Array Add to build parts array, then pass to Gemini Message node.`,
    schema: GeminiMessagePart,
  })
  part: GeminiMessagePart = new GeminiMessagePart()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.part = {
      text: this.text,
      inlineData: this.inlineData,
      fileData: this.fileData,
      functionCall: this.functionCall,
      functionResponse: this.functionResponse,
      executableCode: this.executableCode,
      codeExecutionResult: this.codeExecutionResult,
      thought: this.thought,
      thoughtSignature: this.thoughtSignature,
      videoMetadata: this.videoMetadata,
    }
    return {}
  }
}

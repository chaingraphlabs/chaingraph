/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type * as BetaAPI from '@anthropic-ai/sdk'
// import type { BetaToolUnion } from '@anthropic-ai/sdk/src/resources/beta/messages/messages'
import type {
  EncryptedSecretValue,
  ExecutionContext,
  INode,
  NodeExecutionResult,
  PortType,
} from '@badaitech/chaingraph-types'
import type { ContentBlockBase } from './types'
import { Anthropic } from '@anthropic-ai/sdk'
import {
  ExecutionEventImpl,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  ExecutionEventEnum,
  findPort,
  MultiChannel,
  Node,
  ObjectSchema,
  Output,
  Passthrough,
  PortArray,
  PortBoolean,
  PortEnum,
  PortNumber,
  PortObject,
  PortSecret,
  PortStream,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { MCPToolCallNode } from '../../mcp'
import {
  AntropicMessage,
  AntropicModelTypes,
  AntropicResponseContent,
  ImageBlock,
  MessageMetadata,
  TextBlock,
  TextResponseBlock,
  ThinkingConfig,
  ThinkingResponseBlock,
  TokenUsage,
  Tool,
  ToolChoice,
  ToolResultBlock,
  ToolUseResponseBlock,
} from './types'

const TAGS = {
  THINK: {
    // OPEN: '\n<think>\n',
    // CLOSE: '\n</think>\n',
    OPEN: '\n~~~thoughts\n',
    CLOSE: '\n~~~\n',
  },
  TOOL_USE: {
    OPEN: '\n~~~thoughts\n<tool_use>\n',
    CLOSE: '\n</tool_use>\n~~~\n',
    ID: {
      OPEN: '<tool_id>',
      CLOSE: '</tool_id>\n',
    },
    NAME: {
      OPEN: '<tool_name>',
      CLOSE: '</tool_name>\n',
    },
    INPUT: {
      OPEN: '<tool_input>\n',
      CLOSE: '\n</tool_input>',
    },
  },
  TOOL_RESULT: {
    OPEN: '\n~~~thoughts\n<tool_result>\n',
    CLOSE: '</tool_result>\n~~~\n',
    ID: {
      OPEN: '<tool_result_id>',
      CLOSE: '</tool_result_id>\n',
    },
    CONTENT: {
      OPEN: '<tool_result_content>\n',
      CLOSE: '\n</tool_result_content>\n',
    },
  },
  TEXT: {
    OPEN: '\n\n<text>\n',
    CLOSE: '\n</text>\n',
  },
}

@ObjectSchema({
  description: 'Beta features flags for Anthropic LLM Call Node',
  type: 'AntropicLLMCallNodeFeatures',
})
class AntropicLLMCallNodeFeatures {
  @PortBoolean({
    title: 'code-execution-2025-05-22',
    description: 'Code execution support (beta)\n'
      + 'Claude 3.7/4/4.5 can execute code in Python, JavaScript, and TypeScript. This allows for dynamic code execution within the conversation.',
    defaultValue: false,
  })
  codeExecution20250522: boolean = false

  @PortBoolean({
    title: 'web-search',
    description: 'When you add the web search tool to your API request:\n'
      + '\n'
      + 'Claude decides when to search based on the prompt.\n'
      + 'The API executes the searches and provides Claude with the results. This process may repeat multiple times throughout a single request.\n'
      + 'At the end of its turn, Claude provides a final response with cited sources.',
    defaultValue: false,
  })
  webSearchTool: boolean = false

  // files-api-2025-04-14
  @PortBoolean({
    title: 'files-api-2025-04-14',
    description: 'Code execution can analyze files uploaded via the Files API, such as CSV files, Excel files, and other data formats. This allows Claude to read, process, and generate insights from your data. You can pass multiple files per request.',
    defaultValue: false,
  })
  filesApi20250414: boolean = false

  // interleaved-thinking-2025-05-14
  @PortBoolean({
    title: 'interleaved-thinking-2025-05-14',
    description: 'Interleaved thinking\n'
      + 'Claude 4 models support interleaving tool use with extended thinking, allowing for more natural conversations where tool uses and responses can be mixed with regular messages.',
    defaultValue: false,
  })
  interleavedThinking20250514: boolean = false

  @PortArray({
    title: 'Betas',
    description: 'List of beta features to enable for this node',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
    defaultValue: [],
    isMutable: true,
  })
  betas?: string[] = []
}

/**
 * Main configuration for the Anthropic LLM
 */
@ObjectSchema({
  description: 'Configuration for the Anthropic Claude LLM',
  type: 'AnthropicLLMConfig',
})
export class AnthropicLLMConfig {
  @PortSecret<'anthropic'>({
    title: 'API Key',
    description: 'Your Anthropic API key',
    secretType: 'anthropic',
    required: true,
  })
  apiKey?: EncryptedSecretValue<'anthropic'>

  @PortEnum({
    title: 'Model',
    description: 'The Claude model to use',
    options: [
      { id: AntropicModelTypes.ClaudeHaiku4_5, type: 'string', defaultValue: AntropicModelTypes.ClaudeHaiku4_5, title: 'Claude Haiku 4.5' },
      { id: AntropicModelTypes.ClaudeSonnet4_5, type: 'string', defaultValue: AntropicModelTypes.ClaudeSonnet4_5, title: 'Claude Sonnet 4.5' },
      { id: AntropicModelTypes.ClaudeOpus4_5, type: 'string', defaultValue: AntropicModelTypes.ClaudeOpus4_5, title: 'Claude Opus 4.5' },
      { id: AntropicModelTypes.ClaudeSonnet4_5_20250929, type: 'string', defaultValue: AntropicModelTypes.ClaudeSonnet4_5_20250929, title: 'Claude Sonnet 4.5-20250929' },
      { id: AntropicModelTypes.ClaudeSonnet4_20250514, type: 'string', defaultValue: AntropicModelTypes.ClaudeSonnet4_20250514, title: 'Claude Sonnet 4' },
      { id: AntropicModelTypes.ClaudeOpus4_1_20250805, type: 'string', defaultValue: AntropicModelTypes.ClaudeOpus4_1_20250805, title: 'Claude Opus 4.1' },
      { id: AntropicModelTypes.ClaudeOpus4_20250514, type: 'string', defaultValue: AntropicModelTypes.ClaudeOpus4_20250514, title: 'Claude Opus 4' },
      { id: AntropicModelTypes.Claude37Sonnet20250219, type: 'string', defaultValue: AntropicModelTypes.Claude37Sonnet20250219, title: 'Claude 3.7 Sonnet' },
      { id: AntropicModelTypes.Claude37Opus20250213, type: 'string', defaultValue: AntropicModelTypes.Claude37Opus20250213, title: 'Claude 3.7 Opus' },
      { id: AntropicModelTypes.Claude37Haiku20250304, type: 'string', defaultValue: AntropicModelTypes.Claude37Haiku20250304, title: 'Claude 3.7 Haiku' },
      { id: AntropicModelTypes.Claude35Sonnet20241022, type: 'string', defaultValue: AntropicModelTypes.Claude35Sonnet20241022, title: 'Claude 3.5 Sonnet' },
      { id: AntropicModelTypes.Claude3Sonnet20240229, type: 'string', defaultValue: AntropicModelTypes.Claude3Sonnet20240229, title: 'Claude 3 Sonnet' },
      { id: AntropicModelTypes.Claude3Opus20240229, type: 'string', defaultValue: AntropicModelTypes.Claude3Opus20240229, title: 'Claude 3 Opus' },
      { id: AntropicModelTypes.Claude3Haiku20240307, type: 'string', defaultValue: AntropicModelTypes.Claude3Haiku20240307, title: 'Claude 3 Haiku' },
    ],
    defaultValue: AntropicModelTypes.ClaudeHaiku4_5,
    required: true,
  })
  model: AntropicModelTypes = AntropicModelTypes.ClaudeHaiku4_5

  @PortNumber({
    title: 'Max Tokens',
    description: 'Maximum number of tokens to generate',
    min: 1,
    required: true,
    integer: true,
    defaultValue: 16000,
  })
  max_tokens: number = 16000

  @PortNumber({
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
    defaultValue: 0,
  })
  temperature: number = 0

  @PortNumber({
    title: 'Top P',
    description: 'Controls diversity via nucleus sampling (0.0 to 1.0)',
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: undefined,
  })
  top_p?: number = undefined

  @PortNumber({
    title: 'Top K',
    description: 'Only sample from top K options for each token',
    integer: true,
    defaultValue: undefined,
  })
  top_k?: number = undefined

  @PortArray({
    title: 'Stop Sequences',
    description: 'Custom sequences that will stop generation',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  stop_sequences?: string[]

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

  @PortObject({
    title: 'Tool Choice',
    description: 'Controls how the model should use tools',
    schema: ToolChoice,
    defaultValue: new ToolChoice(),
  })
  tool_choice?: ToolChoice

  @PortBoolean({
    title: 'Stream',
    description: 'Whether to stream the response incrementally',
    ui: {
      hidden: true,
    },
  })
  stream: boolean = true

  @PortNumber({
    title: 'Max Tool Calls',
    description: 'Maximum number of tool calls allowed in a single request',
    min: 0,
    integer: true,
    defaultValue: 20,
  })
  max_tool_calls: number = 20
}

@Node({
  type: 'AntropicLLMCallNode',
  title: 'Anthropic LLM Call',
  description: 'Interact with Anthropic Claude models with support for thinking, tools, and image inputs',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['ai', 'llm', 'claude', 'anthropic', 'image', 'thinking', 'tools'],
})
export class AntropicLlmCallNode extends BaseNode {
  @Passthrough()
  @PortObject({
    title: 'Configuration',
    description: 'Configuration for the Anthropic Claude LLM',
    schema: AnthropicLLMConfig,
    required: true,
  })
  config: AnthropicLLMConfig = new AnthropicLLMConfig()
  // config: AntropicConfig = new AntropicConfig()

  @Passthrough()
  @PortObject({
    title: 'Features',
    description: 'Features flags for the Anthropic LLM Call Node',
    schema: AntropicLLMCallNodeFeatures,
  })
  features: AntropicLLMCallNodeFeatures = new AntropicLLMCallNodeFeatures()

  @Passthrough()
  @PortArray({
    title: 'Tools',
    description: 'Definitions of tools that the model may use',
    itemConfig: {
      type: 'object',
      schema: Tool,
    },
    defaultValue: [],
    isMutable: true,
    ui: {
      allowedTypes: ['object'],
      itemDeletable: true,
      addItemFormHidden: false,
      hideEditor: false,
    },
  })
  tools: Tool[] = []

  @Passthrough()
  @PortString({
    title: 'System',
    description: 'System prompt providing context and instructions to Claude',
    ui: {
      isTextArea: true,
      textareaDimensions: { height: 75 },
    },
  })
  system?: string

  @Passthrough()
  @PortArray({
    title: 'Messages',
    description: 'Array of conversation messages (user and assistant)',
    itemConfig: {
      type: 'object',
      schema: AntropicMessage,
    },
    required: false,
    defaultValue: [],
    isMutable: true,
    ui: {
      allowedTypes: ['object'],
      itemDeletable: true,
      addItemFormHidden: false,
      hideEditor: false,
    },
  })
  messages: AntropicMessage[] = []

  @Output()
  @PortStream({
    title: 'Response Stream',
    description: 'Streamed response from Claude',
    itemConfig: {
      type: 'string',
    },
  })
  responseStream: MultiChannel<string> = new MultiChannel<string>()

  @Output()
  @PortObject({
    title: 'Response Content',
    description: 'Complete response content from Claude',
    schema: AntropicResponseContent,
    ui: {
      hidden: true, // TODO: when generator ports are supported, we can show this in the UI
    },
  })
  responseContent: AntropicResponseContent = new AntropicResponseContent()

  @Output()
  @PortObject({
    title: 'Token Usage',
    description: 'Information about token usage',
    schema: TokenUsage,
    ui: {
      hidden: true, // TODO: when generator ports are supported, we can show this in the UI
    },
  })
  tokenUsage: TokenUsage = new TokenUsage()

  @Output()
  @PortString({
    title: 'Complete Response',
    description: 'Complete text response concatenated from all text blocks',
    ui: {
      hidden: true, // TODO: when generator ports are supported, we can show this in the UI
    },
  })
  completeResponse: string = ''

  /**
   * Convert ChainGraph content blocks to Anthropic's format
   */
  private convertContentBlocksToAnthropicFormat(blocks: ContentBlockBase[]): any[] {
    return blocks.map((block) => {
      if (block.type === 'text') {
        const textBlock = block as TextBlock
        return {
          type: 'text',
          text: textBlock.text,
        }
      } else if (block.type === 'image') {
        const imageBlock = block as ImageBlock
        return {
          type: 'image',
          source: {
            type: imageBlock.source.type,
            media_type: imageBlock.source.media_type,
            data: imageBlock.source.data,
          },
        }
      } else if (block.type === 'tool_result') {
        const toolResultBlock = block as ToolResultBlock
        return {
          type: 'tool_result',
          tool_use_id: toolResultBlock.tool_use_id,
          content: toolResultBlock.content,
        }
      }

      throw new Error(`Unsupported content block type: ${block.type}`)
    })
  }

  /**
   * Process complete response content
   */
  private processResponseContent(message: Anthropic.Beta.Messages.BetaMessage): void {
    if (!message.content)
      return

    this.responseContent = new AntropicResponseContent()

    // Track indexes for sorting
    let textIndex = 0
    let thinkingIndex = 0
    let toolUseIndex = 0

    // Process each content block from Claude
    for (const block of message.content) {
      if (block.type === 'text') {
        const textBlock = new TextResponseBlock()
        textBlock.text = block.text
        textBlock.index = textIndex++

        // Handle citations if present
        if ('citations' in block && block.citations) {
          // textBlock.citations = block.citations.map(citation => ({
          //   type: citation.type,
          //   cited_text: citation.cited_text,
          // document_index: citation.document_index,
          // document_title: citation.document_title || undefined,
          // start_char_index: citation.start_char_index,
          // end_char_index: citation.end_char_index,
          // }))
        }

        this.responseContent.textBlocks.push(textBlock)
      } else if (block.type === 'thinking') {
        const thinkingBlock = new ThinkingResponseBlock()
        thinkingBlock.thinking = block.thinking
        // Preserve the exact signature value
        thinkingBlock.signature = block.signature
        thinkingBlock.index = thinkingIndex++

        this.responseContent.thinkingBlocks.push(thinkingBlock)
      } else if (block.type === 'tool_use') {
        const toolUseBlock = new ToolUseResponseBlock()
        toolUseBlock.id = block.id
        toolUseBlock.name = block.name
        toolUseBlock.input = block.input as any
        toolUseBlock.index = toolUseIndex++

        this.responseContent.toolUseBlocks.push(toolUseBlock)
      }
    }

    // Build complete response from all text blocks
    this.completeResponse = this.responseContent.textBlocks
      .map(block => block.text)
      .join('')
  }

  /**
   * Process token usage from the response
   */
  private processTokenUsage(message: Anthropic.Message): void {
    if (!message.usage)
      return

    this.tokenUsage.input_tokens = message.usage.input_tokens
    this.tokenUsage.output_tokens = message.usage.output_tokens
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      // Reset state and initialize streams
      this.resetState()

      // Validate inputs
      this.validateInputs()

      const { apiKey } = await this.config.apiKey!.decrypt(context)

      // Create Anthropic client
      const client = new Anthropic({
        apiKey,
        maxRetries: 3,
        timeout: 10 * 60 * 1000, // 10 minutes
      })

      // Explicitly resolve the stream port - downstream nodes can start reading NOW
      // Using new thread-safe signature with explicit node ID
      context.resolvePort(this.id, 'responseStream')

      // Stream in main loop (no background actions)
      await this.handleStreamingExecution(client, context)

      return {}
    } catch (error: any) {
      await this.handleError(context, error)
      throw new Error(`Anthropic API Error: ${error.message || PortString(error)}`)
    }
  }

  /**
   * Reset the node's state before execution
   */
  private resetState(): void {
    this.responseContent = new AntropicResponseContent()
    this.tokenUsage = new TokenUsage()
    this.completeResponse = ''

    // Initialize fresh streams
    this.responseStream = new MultiChannel<string>()
  }

  /**
   * Validate required inputs before execution
   */
  private validateInputs(): void {
    if (!this.config) {
      throw new Error('Configuration is required')
    }

    if (!this.config.apiKey) {
      throw new Error('API Key is required')
    }
  }

  /**
   * Build request parameters for Anthropic API
   */
  private buildRequestParameters(
    context: ExecutionContext,
    messages: Anthropic.MessageParam[],
  ): Anthropic.Beta.MessageCreateParams {
    // TODO: Prefill assistant message with the prefix if needed

    // Build message creation parameters
    const params: Anthropic.Beta.MessageCreateParams = {
      model: this.config.model,
      max_tokens: this.config.max_tokens + (this.config.thinking?.budget_tokens || 0),
      messages,
      stream: this.config.stream,
    }

    // Add optional parameters
    if (this.system) {
      params.system = this.system
    }

    if (this.config.temperature !== undefined) {
      params.temperature = this.config.thinking?.type === 'enabled' ? 1 : this.config.temperature
    }

    if (this.config.top_p !== undefined) {
      params.top_p = this.config.top_p
    }

    if (this.config.top_k !== undefined) {
      params.top_k = this.config.top_k
    }

    if (this.config.stop_sequences && this.config.stop_sequences.length > 0) {
      params.stop_sequences = this.config.stop_sequences
    }

    if (this.config.metadata) {
      params.metadata = {
        user_id: this.config.metadata.user_id,
      }
    }

    if (this.config.thinking) {
      if (this.config.thinking.type === 'enabled') {
        params.thinking = {
          type: this.config.thinking.type as 'enabled',
          budget_tokens: this.config.thinking.budget_tokens || 1024,
        }
      } else {
        params.thinking = {
          type: this.config.thinking.type as 'disabled',
        }
      }
    }

    if (this.config.tool_choice && this.tools && this.tools.length > 0) {
      params.tool_choice = {
        type: this.config.tool_choice.type as any,
        disable_parallel_tool_use: this.config.tool_choice.disable_parallel_tool_use,
        name: this.config.tool_choice.name,
      }
    }

    if (this.tools && this.tools.length > 0) {
      /**
       * Filters out pre-configured ports from tool input schema.
       * Pre-configured ports are those with incoming connections.
       */
      function filterPreConfiguredPorts(
        tool: Tool,
        node: INode,
      ): Record<string, any> {
        const filteredProperties: Record<string, any> = {}

        for (const [key, propSchema] of Object.entries(tool.input_schema.properties)) {
          const port = findPort(node, p => p.getConfig().key === key)

          if (!port) {
            // Port not found in node, include it anyway
            filteredProperties[key] = propSchema
            continue
          }

          const config = port.getConfig()
          // Check if port is pre-configured (has incoming connections)
          const isPreConfigured = config.connections && config.connections.length > 0

          if (!isPreConfigured) {
            // Port is NOT pre-configured → include in tool schema for LLM
            filteredProperties[key] = propSchema
          }
          // else: Port IS pre-configured → skip it (don't ask LLM for this value)
        }

        return filteredProperties
      }

      /**
       * Filters required fields to match filtered properties.
       * Removes required fields that are pre-configured.
       */
      function filterRequiredFields(
        tool: Tool,
        node: INode,
      ): string[] {
        if (!tool.input_schema.required) {
          return []
        }

        const filteredRequired: string[] = []

        for (const key of tool.input_schema.required) {
          const port = findPort(node, p => p.getConfig().key === key)

          if (!port) {
            // Port not found, include in required
            filteredRequired.push(key)
            continue
          }

          const config = port.getConfig()
          const isPreConfigured = config.connections && config.connections.length > 0

          if (!isPreConfigured) {
            // Port is NOT pre-configured → include in required
            filteredRequired.push(key)
          }
          // else: Port IS pre-configured → skip (already satisfied)
        }

        return filteredRequired
      }

      function convertToolToToolDefinition(tool: Tool): Anthropic.Beta.BetaToolUnion {
        const nodeId = tool.chaingraph_node_id
        if (!nodeId) {
          throw new Error('Tool chaingraph_node_id is required to convert tool to definition')
        }

        if (context.getNodeById === undefined) {
          throw new Error('Execution context does not support getNodeById method')
        }

        const node = context.getNodeById(nodeId)
        if (!node) {
          throw new Error(`Node with ID ${nodeId} not found in context`)
        }

        // Filter out pre-configured ports from the tool schema
        const filteredProperties = filterPreConfiguredPorts(tool, node)
        const filteredRequired = filterRequiredFields(tool, node)

        return {
          type: 'custom',
          name: tool.name,
          description: tool.description,
          input_schema: {
            type: tool.input_schema.type as 'object',
            properties: filteredProperties,
            required: filteredRequired,
          },
        }
      }

      params.tools = this.tools.map((tool) => {
        return convertToolToToolDefinition(tool)
      })
    }

    if (this.features.codeExecution20250522) {
      if (!params.tools) {
        params.tools = []
      }

      params.tools.push(
        {
          type: 'code_execution_20250522',
          name: 'code_execution',
        },
      )
    }

    if (this.features.webSearchTool) {
      if (!params.tools) {
        params.tools = []
      }

      params.tools.push(
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5,
        },
      )
    }

    return params
  }

  /**
   * Handle streaming execution with tool feedback loop
   */
  private async handleStreamingExecution(
    client: Anthropic,
    context: ExecutionContext,
  ): Promise<void> {
    try {
      // Prepare initial messages from input
      const conversationHistory = (this.messages.length > 0
        ? this.messages.map(msg => ({
            role: msg.role,
            content: this.convertContentBlocksToAnthropicFormat(msg.content),
          }))
        : [
            {
              role: 'user' as const,
              content: this.convertContentBlocksToAnthropicFormat([
                AntropicLlmCallNode.createTextBlock(this.system || ''),
              ]),
            },
          ])

      // Check if the last message is from the assistant then change it to user
      if (conversationHistory.length > 0
        && conversationHistory[conversationHistory.length - 1].role === 'assistant') {
        // Change the last message to user role
        conversationHistory[conversationHistory.length - 1].role = 'user'
      }

      // This tracks the feedback loop when tools are used
      let feedbackLoopCounter = 0
      const MAX_FEEDBACK_LOOPS = this.config.max_tool_calls || 20

      do {
        // Build request parameters with current conversation history
        const params = this.buildRequestParameters(context, conversationHistory)

        // Process the current message stream
        const result = await this.processMessageStream(client, params, context)

        // If the model requested a tool call and we have tools to execute
        if (result.stopReason === 'tool_use'
          && result.toolUseBlocks.length > 0
          && feedbackLoopCounter < MAX_FEEDBACK_LOOPS) {
          // Save the assistant message that contains tool use
          const assistantMessage = {
            role: 'assistant' as const,
            content: this.reconstructAssistantMessageContent(result),
          }

          // Add the assistant message to conversation history
          conversationHistory.push(assistantMessage)

          // Execute the tools and get results
          const toolResults = await this.executeTools(context, result.toolUseBlocks)

          // Add the tool results as a new user message to the conversation
          conversationHistory.push({
            role: 'user' as const,
            content: this.convertContentBlocksToAnthropicFormat(toolResults),
          })

          // Increment the feedback loop counter
          feedbackLoopCounter++
        } else {
          // No more tool calls or we've reached the maximum number of feedback loops
          break
        }
      } while (feedbackLoopCounter < MAX_FEEDBACK_LOOPS)

      // If we broke out due to reaching maximum loops, add a system message and continue
      if (feedbackLoopCounter >= MAX_FEEDBACK_LOOPS) {
        await this.debugLogToEngine(
          context,
          `Warning: Reached maximum tool feedback loops (${MAX_FEEDBACK_LOOPS})`,
        )

        // Add a system message to inform the agent about reaching the limit
        const systemMessage = {
          role: 'user' as const,
          content: this.convertContentBlocksToAnthropicFormat([
            AntropicLlmCallNode.createTextBlock(
              `System: Maximum number of tool calls (${MAX_FEEDBACK_LOOPS}) has been reached. `
              + `Please provide a final response based on the information gathered so far.`,
            ),
          ]),
        }

        conversationHistory.push(systemMessage)

        // Make one final call to get the agent's response
        const finalParams = this.buildRequestParameters(context, conversationHistory)
        await this.processMessageStream(client, finalParams, context)
      }
    } catch (error: any) {
      // Handle errors during streaming
      await this.handleStreamingError(context, error)
      throw error
    } finally {
      // Ensure we close the response stream after execution
      this.responseStream.close()
    }
  }

  private debugLogToEngine(context: ExecutionContext, log: string): Promise<void> {
    return context.sendEvent(new ExecutionEventImpl(
      0,
      ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
      new Date(),
      {
        nodeId: this.id || 'unknown',
        log,
      },
    ))
  }

  /**
   * Reconstruct assistant message content from streaming results
   * Ensures correct ordering of blocks based on their index
   * When thinking is enabled, ensures thinking blocks come first
   */
  private reconstructAssistantMessageContent(result: {
    textBlocks: TextResponseBlock[]
    thinkingBlocks: ThinkingResponseBlock[]
    toolUseBlocks: ToolUseResponseBlock[]
  }): any[] {
    // Standard reconstruction with thinking blocks (when they have valid signatures)
    const content: any[] = []

    // Collect all blocks and sort them by index
    const allBlocks: { type: string, block: any, index: number }[] = []

    // Add thinking blocks first when thinking is enabled
    for (const block of result.thinkingBlocks) {
      // Only include thinking blocks with valid signatures
      allBlocks.push({
        type: 'thinking',
        block,
        index: block.index || 0,
      })
    }

    // Add text blocks
    for (const block of result.textBlocks) {
      allBlocks.push({
        type: 'text',
        block,
        index: block.index || 0,
      })
    }

    // Add tool use blocks
    for (const block of result.toolUseBlocks) {
      allBlocks.push({
        type: 'tool_use',
        block,
        index: block.index || 0,
      })
    }

    // Sort blocks by index
    allBlocks.sort((a, b) => a.index - b.index)

    // Convert blocks to Anthropic format
    for (const item of allBlocks) {
      if (item.type === 'thinking') {
        content.push({
          type: 'thinking',
          thinking: item.block.thinking,
          signature: item.block.signature,
        })
      } else if (item.type === 'text') {
        content.push({
          type: 'text',
          text: item.block.text,
        })
      } else if (item.type === 'tool_use') {
        content.push({
          type: 'tool_use',
          id: item.block.id,
          name: item.block.name,
          input: item.block.input,
        })
      }
    }

    return content
  }

  /**
   * Process a single message stream and collect its results
   */
  private async processMessageStream(
    client: Anthropic,
    params: Anthropic.Beta.MessageCreateParams,
    context: ExecutionContext,
  ): Promise<{
    stopReason: string | null
    textBlocks: TextResponseBlock[]
    thinkingBlocks: ThinkingResponseBlock[]
    toolUseBlocks: ToolUseResponseBlock[]
  }> {
    const betas: Array<BetaAPI.Anthropic.AnthropicBeta> = []

    if (this.features.codeExecution20250522) {
      betas.push('code-execution-2025-05-22')
    }
    if (this.features.filesApi20250414) {
      betas.push('files-api-2025-04-14')
    }
    if (this.features.interleavedThinking20250514) {
      betas.push('interleaved-thinking-2025-05-14')
    }

    if (this.features.betas && this.features.betas.length > 0) {
      betas.push(...this.features.betas)
    }

    // Use Anthropic's streaming API
    const stream = await client.beta.messages.create(
      {
        ...params,
        stream: true,
        betas: betas.length > 0 ? betas : undefined,
      },
      {
        headers: {
          'anthropic-version': '2023-06-01',
        },
        maxRetries: 5,
        stream: true,
        timeout: 15 * 60 * 1000, // 15 minutes
        signal: context.abortSignal,
      },
    )

    // Storage for content blocks, indexed by their position
    const contentBlocks: Record<number, TextResponseBlock | ThinkingResponseBlock | ToolUseResponseBlock> = {}

    // Keep track of accumulated JSON for each tool use block by index
    const jsonAccumulators: Record<number, string> = {}

    // Variables to track message state
    let messageStopReason: string | null = null

    // Process the streaming events
    for await (const event of stream) {
      // Check if execution was aborted
      if (context.abortSignal.aborted) {
        this.responseStream.setError(new Error('Stream aborted'))
        break
      }

      // Process the streaming event based on its type
      if (event.type === 'message_start') {
        // console.log(`[ANTHROPIC] Message start:  ${event.type}, data: ${JSON.stringify(event)}`)
      } else if (event.type === 'content_block_start') {
        // console.log(`[ANTHROPIC] Content block start:  ${event.type}, data: ${JSON.stringify(event)}`)
        await this.handleContentBlockStart(event, contentBlocks, jsonAccumulators, client)
      } else if (event.type === 'content_block_delta') {
        await this.handleContentBlockDelta(event, contentBlocks, jsonAccumulators)
      } else if (event.type === 'content_block_stop') {
        // console.log(`[ANTHROPIC] Content block stop:  ${event.type}, data: ${JSON.stringify(event)}`)
        await this.handleContentBlockStop(event, contentBlocks, jsonAccumulators)
      } else if (event.type === 'message_delta') {
        // console.log(`[ANTHROPIC] Message delta:  ${event.type}, data: ${JSON.stringify(event)}`)
        // Update token usage if available
        if (event.usage) {
          this.tokenUsage.input_tokens = event.usage.input_tokens || 0
          this.tokenUsage.output_tokens = event.usage.output_tokens || 0
        }

        // Capture stop reason if present
        if (event.delta && event.delta.stop_reason) {
          messageStopReason = event.delta.stop_reason
        }
      } else if (event.type === 'message_stop') {
        // console.log(`[ANTHROPIC] Message stop:  ${event.type}, data: ${JSON.stringify(event)}`)
        // End of message, organize the content blocks into their proper categories
        this.organizeContentBlocks(contentBlocks)
      } else {
        console.warn(`Unhandled event type: ${event}, data: ${JSON.stringify(event)}`)
      }

      // await with zero delay to yield control
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    // Extract blocks to return
    const textBlocks = this.responseContent.textBlocks
    const thinkingBlocks = this.responseContent.thinkingBlocks
    const toolUseBlocks = this.responseContent.toolUseBlocks

    // Return the relevant data for feedback loop processing
    return {
      stopReason: messageStopReason,
      textBlocks,
      thinkingBlocks,
      toolUseBlocks,
    }
  }

  /**
   * Recursively merge values into node ports, preserving existing values when new values are partial
   */
  private setPortValuesRecursively(
    // node: BaseNode,
    node: INode,
    values: any,
    parentId: string | undefined,
    nodeType: string,
  ): void {
    for (const [key, value] of Object.entries(values)) {
      const port = findPort(node, (p) => {
        return p.getConfig().key === key
          && (p.getConfig().direction === 'input' || p.getConfig().direction === 'passthrough')
          && !p.isSystem()
          && p.getConfig().parentId === parentId
      })

      if (!port) {
        console.warn(`Port not found for key: ${key} in tool node ${nodeType}`)
        continue
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Get current port value to merge with
        const currentValue = port.getValue()

        if (typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
          // Deep merge: preserve existing fields, add/update new ones
          const mergedValue = this.deepMergeObjects(currentValue, value)
          port.setValue(mergedValue)
        } else {
          // If current value is not an object, just set the new value and recurse into sub-ports
          port.setValue(value)
        }

        // Recursively handle nested object properties
        this.setPortValuesRecursively(node, value, port.id, nodeType)
      } else {
        // Set primitive values directly
        port.setValue(value)
      }
    }
  }

  /**
   * Deep merge two objects, preserving existing values and adding new ones
   */
  private deepMergeObjects(target: any, source: any): any {
    if (typeof target !== 'object' || target === null || Array.isArray(target)) {
      return source
    }

    if (typeof source !== 'object' || source === null || Array.isArray(source)) {
      return source
    }

    const result = { ...target }

    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)
        && typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
        // Recursively merge nested objects
        result[key] = this.deepMergeObjects(result[key], value)
      } else {
        // Replace primitive values or non-object values
        result[key] = value
      }
    }

    return result
  }

  /**
   * Execute tools and return their results
   */
  private async executeTools(
    context: ExecutionContext,
    toolUseBlocks: ToolUseResponseBlock[],
  ): Promise<ToolResultBlock[]> {
    // Log all tool executions at once
    await Promise.all(
      toolUseBlocks.map(toolUseBlock =>
        this.debugLogToEngine(
          context,
          `Executing tool: ${toolUseBlock.name} with input: ${JSON.stringify(toolUseBlock.input)}`,
        ),
      ),
    )

    // Execute all tools in parallel
    const toolPromises = toolUseBlocks.map(async (toolUseBlock): Promise<ToolResultBlock> => {
      try {
        // Find the tool definition in the config
        const toolDefinition = this.tools?.find(tool => tool.name === toolUseBlock.name)

        if (!toolDefinition) {
          throw new Error(`Tool definition not found for: ${toolUseBlock.name}`)
        }

        if (!toolDefinition.chaingraph_node_type) {
          throw new Error(`Tool definition for ${toolUseBlock.name} does not have a chaingraph_node_type defined, so it cannot be executed.`)
        }

        let toolResult: string = 'empty result'

        try {
          if (!context.getNodeById || !toolDefinition.chaingraph_node_id) {
            throw new Error('Execution context does not support getNodeById method or toolDefinition.chaingraph_node_id is missing')
          }

          const originalNodeToExecute = context.getNodeById(toolDefinition.chaingraph_node_id)
          if (!originalNodeToExecute) {
            throw new Error(`Node with ID ${toolDefinition.chaingraph_node_id} not found in context`)
          }

          const nodeToExecute = originalNodeToExecute.clone() as BaseNode

          // Pre-fill pre-configured port values from the original node
          // Pre-configured ports are those with incoming connections
          for (const port of originalNodeToExecute.getInputs()) {
            const config = port.getConfig()
            const isPreConfigured = config.connections && config.connections.length > 0

            if (isPreConfigured) {
              // Copy the pre-configured value to the cloned node
              const value = port.getValue()
              const clonedPort = nodeToExecute.getPort(config.id!)

              if (clonedPort && value !== undefined) {
                clonedPort.setValue(value)
              }
            }
          }

          let toolInput: any = toolUseBlock.input

          if (nodeToExecute instanceof MCPToolCallNode) {
            // Special case for MCPToolCallNode, LLM's very often miss the arguments key in the input for the MCPToolCallNode
            if (!('arguments' in toolUseBlock.input)) {
              // the agent did not provide arguments, so we should take all the input keys and values and wrap them in an arguments object
              toolInput = {
                arguments: Object.fromEntries(
                  Object.entries(toolUseBlock.input).map(([key, value]) => [key, value]),
                ),
              }
            }
          }

          // Fill the node's input ports with the tool use block input (LLM-provided values)
          // This merges with pre-configured values set above
          this.setPortValuesRecursively(
            nodeToExecute,
            toolInput,
            undefined,
            toolDefinition.chaingraph_node_type,
          )

          const executionResult = await nodeToExecute.execute(context)

          // Find all outputs of the nodeToExecute and serialize values to JSON
          if (nodeToExecute instanceof MCPToolCallNode) {
            // Special case for the mcp tool call node

            // check that outputSchema is defined and not empty
            if (nodeToExecute.outputSchema && Object.keys(nodeToExecute.outputSchema).length > 0) {
              toolResult = JSON.stringify(nodeToExecute.structuredContent || {})
            } else if (nodeToExecute.content) {
              // If content is defined, use it as the tool result
              const result = nodeToExecute.content.map((content) => {
                if (content.type === 'text') {
                  // try to json parse the content text
                  try {
                    return JSON.stringify(JSON.parse(content.text))
                  } catch (e) {
                    return content.text
                  }
                }

                return JSON.stringify(content)
              })

              toolResult = result.length === 1 ? result[0] : JSON.stringify(result)
            }
          } else {
            const ignoreOutputPortTypes: PortType[] = [
              'stream',
              'secret',
            ]

            const outputValues = Object.fromEntries(
              Array.from(nodeToExecute.ports.values())
                .filter(port =>
                  port.getConfig().direction === 'output'
                  && !port.getConfig().ui?.hidden
                  && !port.isSystem()
                  && !ignoreOutputPortTypes.includes(port.getConfig().type),
                )
                .map(port => [port.getConfig().key, port.getValue()]),
            )

            // Use the collected outputs as the tool result
            toolResult = JSON.stringify(outputValues)
          }
        } catch (error: any) {
          toolResult = JSON.stringify({
            error: true,
            message: `Error executing tool ${toolUseBlock.name}: ${error.message || PortString(error)}`,
          })
        }

        // Create a tool result block
        const toolResultBlock = new ToolResultBlock()
        toolResultBlock.type = 'tool_result'
        toolResultBlock.tool_use_id = toolUseBlock.id
        toolResultBlock.content = toolResult

        // Send result to stream immediately
        this.responseStream.send(`${TAGS.TOOL_RESULT.OPEN}${TAGS.TOOL_RESULT.ID.OPEN}${toolUseBlock.id}${TAGS.TOOL_RESULT.ID.CLOSE}${TAGS.TOOL_RESULT.CONTENT.OPEN}${toolResult}${TAGS.TOOL_RESULT.CONTENT.CLOSE}${TAGS.TOOL_RESULT.CLOSE}`)

        // Log the result
        await context.sendEvent(
          new ExecutionEventImpl(
            0,
            ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
            new Date(),
            {
              nodeId: this.id || 'unknown',
              log: `Tool execution result:\n${toolResult}`,
            },
          ),
        )

        return toolResultBlock
      } catch (error: any) {
        // Create a tool result block for errors
        const toolResultBlock = new ToolResultBlock()
        toolResultBlock.type = 'tool_result'
        toolResultBlock.tool_use_id = toolUseBlock.id
        toolResultBlock.content = JSON.stringify({
          error: true,
          message: `Error executing tool ${toolUseBlock.name}: ${error.message || PortString(error)}`,
        })

        this.responseStream.send(`${TAGS.TOOL_RESULT.OPEN}${TAGS.TOOL_RESULT.ID.OPEN}${toolUseBlock.id}${TAGS.TOOL_RESULT.ID.CLOSE}${TAGS.TOOL_RESULT.CONTENT.OPEN}${toolResultBlock.content}${TAGS.TOOL_RESULT.CONTENT.CLOSE}${TAGS.TOOL_RESULT.CLOSE}`)

        // Log error
        await this.debugLogToEngine(
          context,
          `Error executing tool ${toolUseBlock.name}: ${error.message || PortString(error)}`,
        )

        return toolResultBlock
      }
    })

    // Wait for all executions to complete and return results in original order
    return await Promise.all(toolPromises)
  }

  /**
   * Handle content_block_start events
   */
  private async handleContentBlockStart(
    event: any,
    contentBlocks: Record<number, TextResponseBlock | ThinkingResponseBlock | ToolUseResponseBlock | ToolResultBlock>,
    jsonAccumulators: Record<number, string>,
    client: Anthropic,
  ): Promise<void> {
    const index = event.index

    // Initialize a new content block based on its type
    if (event.content_block.type === 'text') {
      const textBlock = new TextResponseBlock()
      textBlock.index = index
      textBlock.text = ''
      contentBlocks[index] = textBlock
    } else if (event.content_block.type === 'thinking') {
      const thinkingBlock = new ThinkingResponseBlock()
      thinkingBlock.index = index
      thinkingBlock.thinking = ''

      // Log the signature for debugging
      // console.log(`[ANTHROPIC] Received thinking block signature: ${JSON.stringify(event)}`)

      // Important: preserve the exact signature from the API response
      if (event.content_block.signature) {
        thinkingBlock.signature = event.content_block.signature
      }
      contentBlocks[index] = thinkingBlock

      // this.responseStream.send(event.delta.text || '')
      this.responseStream.send(`${TAGS.THINK.OPEN}`)
    } else if (event.content_block.type === 'tool_use') {
      const toolUseBlock = new ToolUseResponseBlock()
      toolUseBlock.index = index
      toolUseBlock.id = event.content_block.id
      toolUseBlock.name = event.content_block.name
      toolUseBlock.input = {} // Initialize empty input object that will be filled by JSON deltas

      // Initialize the JSON accumulator for this tool
      jsonAccumulators[index] = ''

      contentBlocks[index] = toolUseBlock

      this.responseStream.send(`${TAGS.TOOL_USE.OPEN}${TAGS.TOOL_USE.ID.OPEN}${event.content_block.id}${TAGS.TOOL_USE.ID.CLOSE}${TAGS.TOOL_USE.NAME.OPEN}${event.content_block.name}${TAGS.TOOL_USE.NAME.CLOSE}`)
    } else if (event.content_block.type === 'server_tool_use') {
      const content = event.content_block
      // export interface BetaServerToolUseBlock {
      //   id: string;
      //
      //   input: unknown;
      //
      //   name: 'web_search' | 'code_execution';
      //
      //   type: 'server_tool_use';
      // }

      // console.log(`[ANTHROPIC] Received server tool use block: ${JSON.stringify(event)}`)

      const toolUseBlock = new ToolUseResponseBlock()
      toolUseBlock.index = index
      toolUseBlock.id = event.content_block.id
      toolUseBlock.name = event.content_block.name
      toolUseBlock.input = {} // Initialize empty input object that will be filled by JSON deltas

      // Initialize the JSON accumulator for this tool
      jsonAccumulators[index] = ''

      contentBlocks[index] = toolUseBlock

      this.responseStream.send(`${TAGS.TOOL_USE.OPEN}${TAGS.TOOL_USE.ID.OPEN}${event.content_block.id}${TAGS.TOOL_USE.ID.CLOSE}${TAGS.TOOL_USE.NAME.OPEN}${event.content_block.name}${TAGS.TOOL_USE.NAME.CLOSE}`)
    } else if (event.content_block.type === 'code_execution_tool_result') {
      const contentItem = event.content_block
      //
      // console.log(`[ANTHROPIC] Received code execution tool result block: ${JSON.stringify(event)}`)

      const toolResult = contentItem.content || ''

      // Create a tool result block
      const toolResultBlock = new ToolResultBlock()
      toolResultBlock.type = 'code_execution_tool_result'
      toolResultBlock.tool_use_id = event.content_block.tool_use_id
      toolResultBlock.content = JSON.stringify(toolResult)

      function extractFileIds(response: any): string[] {
        const fileIds: string[] = []
        for (const item of response.content) {
          if (item.type === 'code_execution_output') {
            fileIds.push(item.file_id)
          }
        }
        return fileIds
      }

      if (toolResult.content && typeof toolResult.content === 'object' && Array.isArray(toolResult.content)) {
        // console.log(`[ANTHROPIC] Tool result content is an array: ${JSON.stringify(toolResult.content)}`)

        const fileIds = extractFileIds(toolResult)
        // console.log(`[ANTHROPIC] Extracted file IDs: ${JSON.stringify(fileIds)}`)
        for (const fileId of fileIds) {
          const fileMetadata = await client.beta.files.retrieveMetadata(fileId)
          const fileContentResponse = await client.beta.files.download(fileId)
          const fileContentBlob = await fileContentResponse.blob()

          // console.log(`Downloaded file: ${JSON.stringify(fileMetadata)}`)

          // TODO: send file content to the attachments

          // save the file content to the filesystem
          // const filePath = path.join(os.tmpdir(), fileMetadata.filename || `file-${fileId}`)
          // TODO: send file path to the attachments
          // const fileStream = fs.createWriteStream(filePath)
          // fileStream.on('finish', () => {
          // console.log(`File saved to: ${filePath}`)
          // })

          // Convert blob to buffer and write to file
          // const buffer = await fileContentBlob.arrayBuffer()
          // fileStream.write(Buffer.from(buffer))
          // fileStream.end()
        }
      }

      // toolResults.push(toolResultBlock)
      contentBlocks[index] = toolResultBlock
      this.responseStream.send(`${TAGS.TOOL_RESULT.OPEN}${TAGS.TOOL_RESULT.ID.OPEN}${toolResultBlock.tool_use_id}${TAGS.TOOL_RESULT.ID.CLOSE}${TAGS.TOOL_RESULT.CONTENT.OPEN}${toolResultBlock.content}${TAGS.TOOL_RESULT.CONTENT.CLOSE}${TAGS.TOOL_RESULT.CLOSE}`)
    } else if (event.content_block.type === 'web_search_tool_result') {
      const contentItem = event.content_block
      // console.log(`[ANTHROPIC] Received web search execution tool result block: ${JSON.stringify(event)}`)

      const toolResult = contentItem.content || {}

      // Create a tool result block
      const toolResultBlock = new ToolResultBlock()
      toolResultBlock.type = 'web_search_tool_result'
      toolResultBlock.tool_use_id = event.content_block.tool_use_id
      toolResultBlock.content = JSON.stringify(toolResult)

      let toolResultWithoutEncryptedContent: object | object[] = {}

      if (toolResult && typeof toolResult === 'object' && !Array.isArray(toolResult)) {
        toolResultWithoutEncryptedContent = {
          ...toolResult,
          encrypted_content: undefined, // TODO: handle encrypted content if needed
        }
      } else if (toolResult && Array.isArray(toolResult) && toolResult.length > 0) {
        toolResultWithoutEncryptedContent = toolResult.map(item => ({
          ...item,
          encrypted_content: undefined, // TODO: handle encrypted content if needed
        }))
      } else {
        // console.warn(`[ANTHROPIC] Received web search tool result with unexpected content type: ${typeof toolResult}, content: ${JSON.stringify(toolResult)}`)
        toolResultWithoutEncryptedContent = toolResult
      }

      // console.log(`[ANTHROPIC] Tool result without encrypted content: ${JSON.stringify(toolResultWithoutEncryptedContent)}`)

      contentBlocks[index] = toolResultBlock

      this.responseStream.send(`${TAGS.TOOL_RESULT.OPEN}${TAGS.TOOL_RESULT.ID.OPEN}${toolResultBlock.tool_use_id}${TAGS.TOOL_RESULT.ID.CLOSE}${TAGS.TOOL_RESULT.CONTENT.OPEN}${JSON.stringify(toolResultWithoutEncryptedContent)}${TAGS.TOOL_RESULT.CONTENT.CLOSE}${TAGS.TOOL_RESULT.CLOSE}`)

      // TODO: needs to send tool result block to the output
      // like a: toolResults.push(toolResultBlock)
    } else {
      console.warn(`[ANTHROPIC] Received unknown content block type: ${event.content_block.type} at index ${index}`)
    }
  }

  /**
   * Handle content_block_delta events
   */
  private async handleContentBlockDelta(
    event: any,
    contentBlocks: Record<number, TextResponseBlock | ThinkingResponseBlock | ToolUseResponseBlock>,
    jsonAccumulators: Record<number, string>,
  ): Promise<void> {
    const index = event.index
    const block = contentBlocks[index]

    if (!block) {
      console.warn(`[ANTHROPIC] Received delta for nonexistent block at index ${index}`)
      return
    }

    // Handle delta based on content block type
    if (event.delta.type === 'text_delta') {
      if (block instanceof TextResponseBlock) {
        block.text += event.delta.text || ''
        this.responseStream.send(event.delta.text || '')
      }
    } else if (event.delta.type === 'thinking_delta') {
      if (block instanceof ThinkingResponseBlock) {
        block.thinking += event.delta.thinking || ''
        this.responseStream.send(event.delta.thinking || '')
      }
    } else if (event.delta.type === 'input_json_delta') {
      const currentJson = jsonAccumulators[index] || ''

      // For tool use input, accumulate the JSON fragments
      if (block instanceof ToolUseResponseBlock) {
        const partialJson = event.delta.partial_json || ''

        if (partialJson.length > 0) {
          if (currentJson === '') {
            // Add tool name and input to the JSON accumulator
            this.responseStream.send(`${TAGS.TOOL_USE.INPUT.OPEN}`)
          }
        }

        // Accumulate JSON fragments
        jsonAccumulators[index] += partialJson
      }
    } else if (event.delta.type === 'signature_delta') {
      const thinkingBlock = block as ThinkingResponseBlock
      if (thinkingBlock.signature !== event.delta.signature) {
        // Update the signature only if it's different
        thinkingBlock.signature = event.delta.signature || ''
      }
    } else {
      console.warn(`[ANTHROPIC] Received unknown content block delta type: ${event.delta.type} for block at index ${index}`)
    }
  }

  /**
   * Handle content_block_stop events
   */
  private async handleContentBlockStop(
    event: any,
    contentBlocks: Record<number, TextResponseBlock | ThinkingResponseBlock | ToolUseResponseBlock | any>,
    jsonAccumulators: Record<number, string>,
  ): Promise<void> {
    const index = event.index
    const block = contentBlocks[index]

    // console.log(`[ANTHROPIC] Received content block stop event for block at index ${index}: ${JSON.stringify(event)}`)

    // Handle final processing for a completed block
    if (block instanceof ToolUseResponseBlock) {
      // Final attempt to parse any accumulated JSON
      if (jsonAccumulators[index]) {
        try {
          const parsedInput = JSON.parse(jsonAccumulators[index])

          // Update the tool's input with parsed fields
          for (const key in parsedInput) {
            block.input[key] = parsedInput[key]
          }
        } catch (e) {
          console.warn(`[ANTHROPIC] Failed to parse final tool input JSON: ${e}`)
        }
      } else {
        // If no JSON was accumulated, ensure input is an empty object
        block.input = {}

        console.warn(`[ANTHROPIC] No JSON input accumulated for tool use block at index ${index}, setting input to empty object.`)
      }
    }

    if (block instanceof TextResponseBlock) {
      // send </text>, </think>, or </tool_use> to indicate the end of the block
      // this.responseStream.send(TAGS.TEXT.CLOSE)
    } else if (block instanceof ThinkingResponseBlock) {
      this.responseStream.send(`${TAGS.THINK.CLOSE}`)
    } else if (block instanceof ToolUseResponseBlock) {
      this.responseStream.send(`${JSON.stringify(block, null, 2)}${TAGS.TOOL_USE.INPUT.CLOSE}${TAGS.TOOL_USE.CLOSE}`)
    } else {
      // console.warn(`[ANTHROPIC] Received stop event for unknown block type at index ${index}, typeof block: ${typeof block}, data json: ${JSON.stringify(block)}`)
      // console.warn(`[ANTHROPIC] Received stop event for unknown block type at index ${index}, typeof block: ${typeof block}, EVENT json: ${JSON.stringify(event)}`)
    }
  }

  /**
   * Organize content blocks into their respective categories
   * Ensure they are properly sorted by index
   */
  private organizeContentBlocks(
    contentBlocks: Record<number, TextResponseBlock | ThinkingResponseBlock | ToolUseResponseBlock>,
  ): void {
    // Extract blocks by type, preserving their index
    this.responseContent.textBlocks = Object.values(contentBlocks)
      .filter((block): block is TextResponseBlock => block instanceof TextResponseBlock)
      .sort((a, b) => (a.index || 0) - (b.index || 0))

    this.responseContent.thinkingBlocks = Object.values(contentBlocks)
      .filter((block): block is ThinkingResponseBlock => block instanceof ThinkingResponseBlock)
      .sort((a, b) => (a.index || 0) - (b.index || 0))

    this.responseContent.toolUseBlocks = Object.values(contentBlocks)
      .filter((block): block is ToolUseResponseBlock => block instanceof ToolUseResponseBlock)
      .sort((a, b) => (a.index || 0) - (b.index || 0))

    // Build complete response from all text blocks
    this.completeResponse = this.responseContent.textBlocks
      .map(block => block.text)
      .join('')
  }

  /**
   * Handle streaming errors
   */
  private async handleStreamingError(context: ExecutionContext, error: any): Promise<void> {
    await context.sendEvent(
      new ExecutionEventImpl(
        0,
        ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
        new Date(),
        {
          nodeId: this.id || 'unknown',
          log: `Error during Anthropic streaming: ${error.message || PortString(error)}`,
        },
      ),
    )

    this.responseStream.setError(error)
  }

  /**
   * Handle errors in the execute method
   */
  private async handleError(context: ExecutionContext, error: any): Promise<void> {
    const errorMessage = `Anthropic API Error: ${error.message || PortString(error)}`

    await this.debugLogToEngine(
      context,
      errorMessage,
    )

    // Make sure streams are closed with error
    this.responseStream.setError(error)
    this.responseStream.close()
  }

  /**
   * Helper to create a text content block
   */
  static createTextBlock(text: string): TextBlock {
    const block = new TextBlock()
    block.text = text
    return block
  }

  /**
   * Helper to create an image content block from base64 data
   */
  static createImageBlock(
    base64Data: string,
    mediaType: string = 'image/jpeg',
  ): ImageBlock {
    const block = new ImageBlock()
    block.source.type = 'base64'
    block.source.media_type = mediaType
    block.source.data = base64Data
    return block
  }

  /**
   * Helper to create a tool result content block
   */
  static createToolResultBlock(
    toolUseId: string,
    content: string,
  ): ToolResultBlock {
    const block = new ToolResultBlock()
    block.tool_use_id = toolUseId
    block.content = content
    return block
  }

  /**
   * Helper to create a user message with text
   */
  static createUserTextMessage(text: string): AntropicMessage {
    const message = new AntropicMessage()
    message.role = 'user'
    message.content = [AntropicLlmCallNode.createTextBlock(text)]
    return message
  }

  /**
   * Helper to create an assistant message with text
   */
  static createAssistantTextMessage(text: string): AntropicMessage {
    const message = new AntropicMessage()
    message.role = 'assistant'
    message.content = [AntropicLlmCallNode.createTextBlock(text)]
    return message
  }

  /**
   * Helper to create a user message with mixed content (text and images)
   */
  static createMixedContentMessage(
    role: 'user' | 'assistant',
    contentBlocks: ContentBlockBase[],
  ): AntropicMessage {
    const message = new AntropicMessage()
    message.role = role
    message.content = contentBlocks
    return message
  }
}

export default AntropicLlmCallNode

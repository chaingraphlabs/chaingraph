/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import type {
  ContentBlockBase,
} from './types'
import { Anthropic } from '@anthropic-ai/sdk'
import {
  BaseNode,
  ExecutionEventEnum,
  Input,
  MultiChannel,
  Node,
  Output,
  PortArray,
  PortObject,
  PortStream,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import {
  AntropicConfig,
  AntropicMessage,
  AntropicResponseContent,
  ImageBlock,
  TextBlock,
  TextResponseBlock,
  ThinkingResponseBlock,
  TokenUsage,
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

@Node({
  type: 'AntropicLLMCallNode',
  title: 'Anthropic LLM Call',
  description: 'Interact with Anthropic Claude models with support for thinking, tools, and image inputs',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['ai', 'llm', 'claude', 'anthropic', 'image', 'thinking', 'tools'],
})
export class AntropicLLMCallNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Configuration',
    description: 'Configuration for the Anthropic Claude API',
    schema: AntropicConfig,
    required: true,
  })
  config: AntropicConfig = new AntropicConfig()

  @Input()
  @PortArray({
    title: 'Messages',
    description: 'Array of conversation messages (user and assistant)',
    itemConfig: {
      type: 'object',
      schema: AntropicMessage,
    },
    required: true,
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
  })
  responseContent: AntropicResponseContent = new AntropicResponseContent()

  @Output()
  @PortObject({
    title: 'Token Usage',
    description: 'Information about token usage',
    schema: TokenUsage,
  })
  tokenUsage: TokenUsage = new TokenUsage()

  @Output()
  @String({
    title: 'Complete Response',
    description: 'Complete text response concatenated from all text blocks',
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
  private processResponseContent(message: Anthropic.Message): void {
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

      // Create Anthropic client
      const client = new Anthropic({
        apiKey: this.config.apiKey,
        maxRetries: 3,
        timeout: 10 * 60 * 1000, // 10 minutes
      })

      // Log the upcoming request
      await context.sendEvent({
        index: 0,
        type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
        timestamp: new Date(),
        data: {
          node: this.clone(),
          log: `Executing Anthropic LLM call with model: ${this.config.model}`,
        },
      })

      if (this.config.stream) {
        return {
          backgroundActions: [() => this.handleStreamingExecution(client, context)],
        }
      } else {
        // Handle non-streaming execution
        await this.handleNonStreamingExecution(client, context)
        return {}
      }
    } catch (error: any) {
      await this.handleError(context, error)
      throw new Error(`Anthropic API Error: ${error.message || String(error)}`)
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
  private buildRequestParameters(messages: Anthropic.MessageParam[]): Anthropic.MessageCreateParams {
    // Build message creation parameters
    const params: Anthropic.MessageCreateParams = {
      model: this.config.model,
      max_tokens: this.config.max_tokens + (this.config.thinking?.budget_tokens || 0),
      messages,
      stream: this.config.stream,
    }

    // Add optional parameters
    if (this.config.system) {
      params.system = this.config.system
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
      params.thinking = {
        type: this.config.thinking.type as 'enabled' | 'disabled',
        budget_tokens: this.config.thinking.budget_tokens,
      }
    }

    if (this.config.tools && this.config.tools.length > 0) {
      if (this.config.tool_choice) {
        // params.tool_choice = {
        //   type: this.config.tool_choice.type,
        //   disable_parallel_tool_use: this.config.tool_choice.disable_parallel_tool_use,
        // }
      }

      // params.tools = this.config.tools.map(tool => ({
      //   name: tool.name,
      //   description: tool.description,
      //   input_schema: {
      //     type: tool.input_schema.type,
      //     properties: tool.input_schema.properties,
      //     required: tool.input_schema.required,
      //   },
      // }))
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
      console.log(`[ANTHROPIC] Streaming enabled, using stream API, config: ${JSON.stringify(this.config)}`)

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
                AntropicLLMCallNode.createTextBlock(this.config.system || ''),
              ]),
            },
          ])

      // This tracks the feedback loop when tools are used
      let feedbackLoopCounter = 0
      const MAX_FEEDBACK_LOOPS = 5 // Prevent infinite loops

      do {
        // Build request parameters with current conversation history
        const params = this.buildRequestParameters(conversationHistory)

        // Process the current message stream
        const result = await this.processMessageStream(client, params, context)

        // If the model requested a tool call and we have tools to execute
        if (result.stopReason === 'tool_use' && result.toolUseBlocks.length > 0
          && feedbackLoopCounter < MAX_FEEDBACK_LOOPS) {
          // Save the assistant message that contains tool use
          const assistantMessage = {
            role: 'assistant' as const,
            content: this.reconstructAssistantMessageContent(result),
          }

          // Add debug log to inspect the reconstructed message
          await context.sendEvent({
            index: 0,
            type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
            timestamp: new Date(),
            data: {
              node: this.clone(),
              log: `Reconstructed assistant message content: ${JSON.stringify(assistantMessage.content)}`,
            },
          })

          // Add the assistant message to conversation history
          conversationHistory.push(assistantMessage)

          // Log that we're going to execute tools
          await context.sendEvent({
            index: 0,
            type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
            timestamp: new Date(),
            data: {
              node: this.clone(),
              log: `LLM requested tool execution: ${result.toolUseBlocks.map(block => block.name).join(', ')}`,
            },
          })

          // Execute the tools and get results
          const toolResults = await this.executeTools(result.toolUseBlocks, context)

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

      // If we broke out due to reaching maximum loops, log a warning
      if (feedbackLoopCounter >= MAX_FEEDBACK_LOOPS) {
        await context.sendEvent({
          index: 0,
          type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
          timestamp: new Date(),
          data: {
            node: this.clone(),
            log: `Warning: Reached maximum tool feedback loops (${MAX_FEEDBACK_LOOPS})`,
          },
        })
      }

      // Close streams
      this.responseStream.close()
    } catch (error: any) {
      // Handle errors during streaming
      await this.handleStreamingError(context, error)
      throw error
    }
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
    params: Anthropic.MessageCreateParams,
    context: ExecutionContext,
  ): Promise<{
      stopReason: string | null
      textBlocks: TextResponseBlock[]
      thinkingBlocks: ThinkingResponseBlock[]
      toolUseBlocks: ToolUseResponseBlock[]
    }> {
    // Use Anthropic's streaming API
    const stream = await client.messages.create(
      {
        ...params,
        stream: true,
      },
      {
        headers: {
          'anthropic-version': '2023-06-01',
        },
        maxRetries: 3,
        stream: true,
        timeout: 10 * 60 * 1000, // 10 minutes
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

      console.log(`[ANTHROPIC] Streaming event type: ${event.type}, data: ${JSON.stringify(event)}`)

      // Process the streaming event based on its type
      if (event.type === 'content_block_start') {
        await this.handleContentBlockStart(event, contentBlocks, jsonAccumulators)
      } else if (event.type === 'content_block_delta') {
        await this.handleContentBlockDelta(event, contentBlocks, jsonAccumulators)
      } else if (event.type === 'content_block_stop') {
        await this.handleContentBlockStop(event, contentBlocks, jsonAccumulators)
      } else if (event.type === 'message_delta') {
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
        // End of message, organize the content blocks into their proper categories
        this.organizeContentBlocks(contentBlocks)
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
   * Execute tools and return their results
   */
  private async executeTools(
    toolUseBlocks: ToolUseResponseBlock[],
    context: ExecutionContext,
  ): Promise<ToolResultBlock[]> {
    const toolResults: ToolResultBlock[] = []

    // For each tool use block, execute the corresponding tool
    for (const toolUseBlock of toolUseBlocks) {
      try {
        // Log that we're executing a tool
        await context.sendEvent({
          index: 0,
          type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
          timestamp: new Date(),
          data: {
            node: this.clone(),
            log: `Executing tool: ${toolUseBlock.name} with input: ${JSON.stringify(toolUseBlock.input)}`,
          },
        })

        // Find the tool definition in the config
        const toolDefinition = this.config.tools?.find(tool => tool.name === toolUseBlock.name)

        if (!toolDefinition) {
          throw new Error(`Tool definition not found for: ${toolUseBlock.name}`)
        }

        // In a real implementation, you would execute the tool here
        // For now, we'll provide a mock result for demonstration
        let toolResult: string

        // Simple mock implementations for common tools
        if (toolUseBlock.name === 'weather_today') {
          toolResult = `Weather for ${toolUseBlock.input.city}, ${toolUseBlock.input.country}: 72°F and sunny.`
        } else {
          toolResult = `Mocked result for ${toolUseBlock.name} with input: ${JSON.stringify(toolUseBlock.input)}`
        }

        // Create a tool result block
        const toolResultBlock = new ToolResultBlock()
        toolResultBlock.type = 'tool_result'
        toolResultBlock.tool_use_id = toolUseBlock.id
        toolResultBlock.content = toolResult

        toolResults.push(toolResultBlock)
        this.responseStream.send(`${TAGS.TOOL_RESULT.OPEN}${TAGS.TOOL_RESULT.ID.OPEN}${toolUseBlock.id}${TAGS.TOOL_RESULT.ID.CLOSE}${TAGS.TOOL_RESULT.CONTENT.OPEN}${toolResult}${TAGS.TOOL_RESULT.CONTENT.CLOSE}${TAGS.TOOL_RESULT.CLOSE}`)

        // Log the result
        await context.sendEvent({
          index: 0,
          type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
          timestamp: new Date(),
          data: {
            node: this.clone(),
            log: `Tool execution result: ${toolResult}`,
          },
        })
      } catch (error: any) {
        // Log error but continue with other tools
        await context.sendEvent({
          index: 0,
          type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
          timestamp: new Date(),
          data: {
            node: this.clone(),
            log: `Error executing tool ${toolUseBlock.name}: ${error.message || String(error)}`,
          },
        })
      }
    }

    return toolResults
  }

  /**
   * Handle non-streaming execution
   */
  private async handleNonStreamingExecution(
    client: Anthropic,
    context: ExecutionContext,
  ): Promise<void> {
    // Initialize conversation history
    const conversationHistory = (this.messages.length > 0
      ? this.messages.map(msg => ({
          role: msg.role,
          content: this.convertContentBlocksToAnthropicFormat(msg.content),
        }))
      : [
          {
            role: 'user' as const,
            content: this.convertContentBlocksToAnthropicFormat([
              AntropicLLMCallNode.createTextBlock(this.config.system || ''),
            ]),
          },
        ])

    // Maximum iterations to prevent infinite loops
    const MAX_ITERATIONS = 5
    let iterationCount = 0

    let finalResponse: Anthropic.Message | null = null

    // Tool feedback loop
    while (iterationCount < MAX_ITERATIONS) {
      // Build parameters with current conversation history
      const params = this.buildRequestParameters(conversationHistory)

      // Execute the non-streaming request
      const response = await client.messages.create({
        ...params,
        stream: false,
      })

      // Save this as the final response
      finalResponse = response

      // Update token usage
      if (response.usage) {
        if (iterationCount === 0) {
          this.tokenUsage.input_tokens = response.usage.input_tokens || 0
          this.tokenUsage.output_tokens = response.usage.output_tokens || 0
        } else {
          // Accumulate tokens for subsequent calls
          this.tokenUsage.input_tokens += response.usage.input_tokens || 0
          this.tokenUsage.output_tokens += response.usage.output_tokens || 0
        }
      }

      // Check if there are tool calls to process
      if (response.stop_reason === 'tool_use' && response.content) {
        // Extract tool use blocks
        const toolUseBlocks: ToolUseResponseBlock[] = []

        for (const block of response.content) {
          if (block.type === 'tool_use') {
            const toolUseBlock = new ToolUseResponseBlock()
            toolUseBlock.id = block.id
            toolUseBlock.name = block.name
            toolUseBlock.input = block.input as any
            toolUseBlocks.push(toolUseBlock)
          }
        }

        if (toolUseBlocks.length > 0) {
          // Add the assistant response to the conversation history
          conversationHistory.push({
            role: 'assistant',
            content: response.content,
          })

          // Execute the tools
          const toolResults = await this.executeTools(toolUseBlocks, context)

          // Add tool results as a new user message
          conversationHistory.push({
            role: 'user',
            content: this.convertContentBlocksToAnthropicFormat(toolResults),
          })

          // Continue to next iteration
          iterationCount++
          continue
        }
      }

      // If we reach here, there are no more tool calls to process
      break
    }

    // Process the final response
    if (finalResponse) {
      this.processResponseContent(finalResponse)
    }

    // Log completion
    await context.sendEvent({
      index: 0,
      type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
      timestamp: new Date(),
      data: {
        node: this.clone(),
        log: `Received final response from Anthropic. Token usage: ${this.tokenUsage.input_tokens} input, ${this.tokenUsage.output_tokens} output tokens.`,
      },
    })
  }

  /**
   * Handle content_block_start events
   */
  private async handleContentBlockStart(
    event: any,
    contentBlocks: Record<number, TextResponseBlock | ThinkingResponseBlock | ToolUseResponseBlock>,
    jsonAccumulators: Record<number, string>,
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
    }
  }

  /**
   * Handle content_block_stop events
   */
  private async handleContentBlockStop(
    event: any,
    contentBlocks: Record<number, TextResponseBlock | ThinkingResponseBlock | ToolUseResponseBlock>,
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
      }
    }

    // send </text>, </think>, or </tool_use> to indicate the end of the block
    if (block instanceof TextResponseBlock) {
      // this.responseStream.send(TAGS.TEXT.CLOSE)
    } else if (block instanceof ThinkingResponseBlock) {
      this.responseStream.send(`${TAGS.THINK.CLOSE}`)
    } else if (block instanceof ToolUseResponseBlock) {
      // Close the JSON input tag
      this.responseStream.send(`${JSON.stringify(block.input, null, 2)}${TAGS.TOOL_USE.INPUT.CLOSE}${TAGS.TOOL_USE.CLOSE}`)
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
    await context.sendEvent({
      index: 0,
      type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
      timestamp: new Date(),
      data: {
        node: this.clone(),
        log: `Error during Anthropic streaming: ${error.message || String(error)}`,
      },
    })

    this.responseStream.setError(error)
  }

  /**
   * Handle errors in the execute method
   */
  private async handleError(context: ExecutionContext, error: any): Promise<void> {
    const errorMessage = `Anthropic API Error: ${error.message || String(error)}`

    await context.sendEvent({
      index: 0,
      type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
      timestamp: new Date(),
      data: {
        node: this.clone(),
        log: errorMessage,
      },
    })

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
    message.content = [AntropicLLMCallNode.createTextBlock(text)]
    return message
  }

  /**
   * Helper to create an assistant message with text
   */
  static createAssistantTextMessage(text: string): AntropicMessage {
    const message = new AntropicMessage()
    message.role = 'assistant'
    message.content = [AntropicLLMCallNode.createTextBlock(text)]
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

export default AntropicLLMCallNode

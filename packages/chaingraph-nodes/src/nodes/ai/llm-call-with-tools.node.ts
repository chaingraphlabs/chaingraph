/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  IPort,
  NodeExecutionResult,
  ObjectPort,
} from '@badaitech/chaingraph-types'
import type { ChatAnthropic } from '@langchain/anthropic'
import type { ChatDeepSeek } from '@langchain/deepseek'
import type { ChatGroq } from '@langchain/groq'
import type { ChatOpenAI } from '@langchain/openai'
import {
  BaseNode,
  ExecutionEventEnum,
  findPort,
  Input,
  Node,
  ObjectSchema,
  Output,
  PortArray,
  PortBoolean,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'
import { NODE_CATEGORIES } from '../../categories'
import { createLLMInstance, LLMConfig } from './llm-call-with-structured-output.node'
import { ToolDefinition } from './tool'

@ObjectSchema({
  description: 'Tool call output from LLM',
})
class ToolCallOutput {
  @PortString({
    title: 'Tool Name',
    description: 'The name of the tool that was called',
  })
  toolName: string = ''

  @PortObject({
    title: 'Parameters',
    description: 'The parameters provided by the LLM for the tool call',
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
  })
  parameters: Record<string, any> = {}
}

@Node({
  type: 'LLMCallWithToolsNode',
  title: 'LLM Call with Tools',
  description: 'Calls a language model with a set of tools and extracts the tool invocations from the response',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'tool', 'agent', 'function calling'],
})
class LLMCallWithToolsNode extends BaseNode {
  @Input()
  @PortObject({
    schema: LLMConfig,
    title: 'LLM Configuration',
    description: 'Configuration for the LLM call',
  })
  config: LLMConfig = new LLMConfig()

  @Input()
  @PortArray({
    title: 'Tools',
    description: 'Array of tools that the LLM can use',
    itemConfig: {
      type: 'object',
      schema: ToolDefinition,
    },
    defaultValue: [],
  })
  tools: ToolDefinition[] = []

  @Input()
  @PortString({
    title: 'Prompt',
    description: 'Input prompt for the language model',
    ui: {
      isTextArea: true,
    },
  })
  prompt: string = ''

  @Input()
  @PortBoolean({
    title: 'Force Tool Use',
    description: 'Force the model to use a tool instead of generating a text response',
    defaultValue: false,
  })
  forceToolUse: boolean = false

  @Input()
  @PortBoolean({
    title: 'Strict Validation',
    description: 'Enforce strict validation of tool parameters (OpenAI only)',
    defaultValue: true,
  })
  strictValidation: boolean = true

  @Output()
  @PortString({
    title: 'Model Response',
    description: 'Text response from the language model if no tool was called',
  })
  response: string = ''

  @Output()
  @PortObject({
    schema: ToolCallOutput,
    title: 'Tool Call',
    description: 'Information about the tool that was called by the LLM',
    ui: {
      hidePropertyEditor: true,
    },
  })
  toolCall: ToolCallOutput = new ToolCallOutput()

  @Output()
  @PortBoolean({
    title: 'Tool Used',
    description: 'Whether a tool was called by the model',
    defaultValue: false,
  })
  toolUsed: boolean = false

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.config.apiKey) {
      throw new Error('API Key is required')
    }

    if (!this.prompt) {
      throw new Error('Prompt is required')
    }

    const { apiKey } = await this.config.apiKey.decrypt(context)

    try {
      // Log execution start
      await this.debugLog(context, 'Starting LLM call with tools')

      // Convert our tool definitions to LangChain format
      const toolDefinitions = this.prepareToolDefinitions()

      if (toolDefinitions.length === 0) {
        await this.debugLog(context, 'Warning: No tools defined. The model will generate a text response only.')
      }

      // Create the appropriate LLM instance
      const llm = createLLMInstance(this.config, apiKey)

      // Bind tools to the model
      const modelWithTools = this.bindToolsToModel(llm, toolDefinitions)

      // Set up message array for the model
      const messages = [
        new SystemMessage(
          'You are a helpful assistant that can use tools when necessary. '
          + 'Analyze the user request and determine if you need to use a tool to respond. '
          + 'If a tool is needed, call it with the appropriate parameters.',
        ),
        new HumanMessage(this.prompt),
      ]

      // Call the model
      try {
        const result = await modelWithTools.invoke(messages, {
          signal: context.abortSignal,
        })

        // Process the result
        await this.processModelResult(result, context)

        return {}
      } catch (error) {
        await this.debugLog(context, `Error during model invocation: ${error}`)
        throw error
      }
    } catch (error: any) {
      const errorMessage = `Failed to execute LLM call with tools: ${error.message || PortString(error)}`
      await this.debugLog(context, `ERROR: ${errorMessage}`)
      console.error('Error processing LLM call with tools:', error)
      throw new Error(errorMessage)
    }
  }

  /**
   * Log debug messages to the execution context
   */
  private async debugLog(context: ExecutionContext, message: string): Promise<void> {
    console.log(`[LLMCallWithTools:${this.id}] ${message}`)

    await context.sendEvent({
      index: 0,
      type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
      timestamp: new Date(),
      data: {
        node: this.clone(),
        log: message,
      },
    })
  }

  /**
   * Convert our tool definitions to LangChain format
   */
  private prepareToolDefinitions(): any[] {
    console.log(`[LLMCallWithToolsNode:${this.id}] Preparing tool definitions, length: ${this.tools.length}`)

    return this.tools.map((toolDef) => {
      // Create a Zod schema from the parameters object
      const parameterProperties: Record<string, z.ZodTypeAny> = {}

      // Recursively process parameter properties to create Zod schema
      for (const [key, value] of Object.entries(toolDef.parameters)) {
        // Handle different parameter types based on their configurations
        // This is a simplification - in practice you'd want to handle more complex nested schemas
        if (typeof value === 'string') {
          parameterProperties[key] = z.string().describe(value)
        } else if (typeof value === 'number') {
          parameterProperties[key] = z.number().describe('A number parameter')
        } else if (typeof value === 'boolean') {
          parameterProperties[key] = z.boolean().describe('A boolean parameter')
        } else if (Array.isArray(value)) {
          parameterProperties[key] = z.array(z.any()).describe('An array parameter')
        } else if (typeof value === 'object' && value !== null) {
          // For objects, we use the description if available or a default one
          const description = value.description || 'A parameter object'
          parameterProperties[key] = z.object({}).describe(description)
        } else {
          // Default to any for unknown types
          // parameterProperties[key] = z.any().describe('A parameter')
          parameterProperties[key] = z.string().describe(value)
        }
      }

      // Create the schema for the tool
      const schema = z.object(parameterProperties)

      // Return the tool definition in the format LangChain expects
      return {
        type: 'function',
        function: {
          name: toolDef.name,
          description: toolDef.description,
          parameters: schema,
        },
      }
    })
  }

  /**
   * Bind tools to the model
   */
  private bindToolsToModel(
    llm: ChatOpenAI | ChatAnthropic | ChatDeepSeek | ChatGroq,
    toolDefinitions: any[],
  ): any {
    const options: any = {
      strict: this.strictValidation,
    }

    // If force tool use is enabled and we have tools, set tool_choice to 'any'
    if (this.forceToolUse && toolDefinitions.length > 0) {
      options.tool_choice = 'any'
    }

    return llm.bindTools(toolDefinitions, options)
  }

  /**
   * Process the model result, extracting tool calls if present
   */
  private async processModelResult(result: any, context: ExecutionContext): Promise<void> {
    // Reset outputs
    this.response = ''
    this.toolCall = new ToolCallOutput()
    this.toolUsed = false

    await this.debugLog(context, `Raw model response: ${JSON.stringify(result)}`)

    // Check if the model made any tool calls
    if (result.tool_calls && result.tool_calls.length > 0) {
      const toolCall = result.tool_calls[0]

      await this.debugLog(context, `Tool called: ${toolCall.name}`)
      await this.debugLog(context, `Tool args: ${JSON.stringify(toolCall.args)}`)

      // Set the tool call output
      this.toolCall.toolName = toolCall.name
      this.toolCall.parameters = toolCall.args
      this.toolUsed = true

      // Update the output port structure to match the parameters
      this.updateToolCallParametersPort(toolCall)
    } else {
      // If no tool was called, set the text response
      this.response = result.content
      await this.debugLog(context, `Text response: ${this.response}`)
    }
  }

  /**
   * Update the tool call parameters port to match the structure of the parameters
   */
  // private updateToolCallParametersPort(toolCall: ToolCall): void {
  private updateToolCallParametersPort(toolCall: any): void {
    const toolCallPort = findPort(this, port =>
      port.getConfig().key === 'toolCall' && !port.getConfig().parentId) as ObjectPort | undefined

    if (!toolCallPort)
      return

    const parametersPort = findPort(this, port =>
      port.getConfig().parentId === toolCallPort.id && port.getConfig().key === 'parameters') as ObjectPort | undefined

    if (!parametersPort)
      return

    // Clear existing properties
    const existingProperties = parametersPort.getConfig().schema?.properties || {}
    for (const key of Object.keys(existingProperties)) {
      this.removeObjectProperty(parametersPort as IPort, key)
    }

    // Add new properties based on the tool call parameters
    for (const [key, value] of Object.entries(toolCall.args)) {
      let portConfig

      if (typeof value === 'string') {
        portConfig = { type: 'string', defaultValue: value }
      } else if (typeof value === 'number') {
        portConfig = { type: 'number', defaultValue: value }
      } else if (typeof value === 'boolean') {
        portConfig = { type: 'boolean', defaultValue: value }
      } else if (Array.isArray(value)) {
        portConfig = {
          type: 'array',
          defaultValue: value,
          itemConfig: { type: 'any' },
        }
      } else if (typeof value === 'object' && value !== null) {
        portConfig = {
          type: 'object',
          defaultValue: value,
          schema: {
            type: 'object',
            properties: {},
          },
        }
      } else {
        portConfig = { type: 'any', defaultValue: value }
      }

      this.addObjectProperty(parametersPort as IPort, key, portConfig)
    }
  }
}

export default LLMCallWithToolsNode

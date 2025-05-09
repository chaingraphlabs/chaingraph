/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPort,
  ExecutionContext,
  NodeEvent,
  NodeExecutionResult,
  ObjectPort,
  ObjectPortConfig,
  PortConnectedEvent,
} from '@badaitech/chaingraph-types'
import {
  ObjectSchema,
} from '@badaitech/chaingraph-types'
import {
  findPort,
} from '@badaitech/chaingraph-types'
import {
  NodeEventType,
} from '@badaitech/chaingraph-types'
import { ExecutionEventEnum, PortAny } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Number,
  Output,
  PortEnumFromObject,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatDeepSeek } from '@langchain/deepseek'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'
import { NODE_CATEGORIES } from '../../categories'
import { LLMModels, llmModels } from './llm-call.node'

@ObjectSchema({
  description: 'Configuration for LLM Call with Structured Output Node',
})
class LLMConfig {
  @PortEnumFromObject(llmModels, {
    title: 'Model',
    description: 'Language Model to use',
  })
  model: keyof typeof llmModels = LLMModels.Gpt4oMini

  @String({
    title: 'API Key',
    description: 'API Key for the LLM provider',
    ui: {
      isPassword: true,
    },
  })
  apiKey: string = ''

  @Input()
  @Number({
    title: 'Temperature',
    description: 'Temperature for sampling',
    min: 0,
    max: 1,
    step: 0.01,
    ui: {
      isSlider: true,
      leftSliderLabel: 'More deterministic',
      rightSliderLabel: 'More creative',
    },
  })
  temperature: number = 0
}

@ObjectSchema({
  description: 'LLM Tool configuration for structured output',
})
class LLMToolConfig {
  @String({
    title: 'Tool Name',
    description: 'Name of the tool to be used',
  })
  name: string = ''

  @String({
    title: 'Tool Description',
    description: 'Description of the tool to be used',
  })
  description: string = ''
}

@Node({
  type: 'LLMCallWithStructuredOutputNode',
  title: 'LLM Call with Structured Output',
  description: 'Sends prompt to Language Model and parses the response into a structured format based on the defined schema',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'prompt', 'structured', 'schema', 'json', 'object'],
})
class LLMCallWithStructuredOutputNode extends BaseNode {
  @Input()
  @PortObject({
    schema: LLMConfig,
    title: 'LLM Configuration',
    description: 'Configuration for the LLM call',

  })
  config: LLMConfig = new LLMConfig()

  @Input()
  @PortAny({
    title: 'Output Schema',
    description: 'Schema for the structured output from the LLM. You can connect object port to this port and it will be used to generate the schema.',
  })
  outputSchema: any = {}

  @Input()
  @String({
    title: 'Prompt',
    description: 'Input prompt for the language model',
    ui: {
      isTextArea: true,
    },
  })
  prompt: string = ''

  @Output()
  @PortObject({
    title: 'Structured Response',
    description: 'Parsed structured output from the LLM response',
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      keyDeletable: true,
      hideEditor: false,
    },
  })
  structuredResponse: Record<string, any> = {}

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.config.apiKey) {
      throw new Error('API Key is required')
    }

    try {
      // Log execution start
      await this.debugLog(context, 'Starting structured output generation')

      // Generate structured response
      const structuredResponse = await this.generateStructuredResponse(context)

      for (const [key, value] of Object.entries(structuredResponse)) {
        // Set the structured response in the output port
        this.structuredResponse[key] = value
      }

      // Log final result
      await this.debugLog(context, `Final structured response: ${JSON.stringify(structuredResponse, null, 2)}`)

      return {}
    } catch (error: any) {
      const errorMessage = `Failed to generate structured output: ${error.message || String(error)}`
      await this.debugLog(context, `ERROR: ${errorMessage}`)
      console.error('Error processing structured output:', error)
      throw new Error(errorMessage)
    }
  }

  /**
   * Handle node events to maintain port synchronization
   */
  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    switch (event.type) {
      case NodeEventType.PortConnected:
        await this.handlePortConnected(event as PortConnectedEvent)
        break
    }
  }

  /**
   * Handle port connection events - specifically for "any" ports
   */
  private async handlePortConnected(event: PortConnectedEvent): Promise<void> {
    // Only process connections from our own inputs and for "any" ports
    if (event.sourceNode.id !== this.id) {
      return
    }

    const sourcePort = event.sourcePort
    const sourcePortConfig = sourcePort.getConfig()

    if (
      sourcePortConfig.key !== 'outputSchema'
      || sourcePortConfig.direction !== 'input'
      || sourcePortConfig.parentId
    ) {
      return
    }

    if (!sourcePortConfig || sourcePortConfig.type !== 'any') {
      return
    }

    const outputSchemaPort = sourcePort as AnyPort
    const underlyingType = outputSchemaPort.getRawConfig().underlyingType
    if (!underlyingType) {
      return
    }

    if (underlyingType.type !== 'object') {
      return
    }

    const outputSchemaPortConfig = underlyingType as ObjectPortConfig

    // get the structuredResponse port and update its schema
    const structuredResponsePort = findPort(this, (port) => {
      return port.getConfig().key === 'structuredResponse'
        && !port.getConfig().parentId
        && port.getConfig().direction === 'output'
    })

    if (!structuredResponsePort) {
      return
    }

    // iterate over the properties of the outputSchema port and add them to the structuredResponse port
    for (const [key, value] of Object.entries(outputSchemaPortConfig.schema.properties)) {
      // check if the property already exists in the structuredResponse port
      const existingProperty = (structuredResponsePort as ObjectPort).getConfig().schema.properties[key]
      if (existingProperty) {
        continue
      }

      this.addObjectProperty(structuredResponsePort, key, value)
    }
  }

  private async generateStructuredResponse(context: ExecutionContext): Promise<Record<string, any>> {
    // Get the output port for structuredResponse to extract its schema
    const outputPort = this.findPortByKey('structuredResponse')
    if (!outputPort) {
      throw new Error('Could not find structuredResponse port')
    }

    // Extract the schema from the port configuration
    const portConfig = (outputPort as ObjectPort).getConfig()
    const schema = portConfig.schema

    // If schema is empty or not defined, return early with a default object
    if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
      return {
        note: 'No schema defined for structured output',
        rawResponse: 'Define properties in the Structured Response to get parsed results',
      }
    }

    // Create a Zod schema from the port schema
    const zodSchema = this.createZodSchemaFromPortSchema(schema)

    // Create the appropriate LLM instance
    let llm: ChatOpenAI | ChatAnthropic | ChatDeepSeek

    if (this.config.model === LLMModels.DeepseekReasoner || this.config.model === LLMModels.DeepseekChat) {
      llm = new ChatDeepSeek({
        apiKey: this.config.apiKey,
        model: this.config.model,
        temperature: this.config.temperature,
      })
    } else if (this.config.model === LLMModels.Claude35Sonnet20241022 || this.config.model === LLMModels.Claude37Sonnet20250219) {
      llm = new ChatAnthropic({
        apiKey: this.config.apiKey,
        model: this.config.model,
        temperature: this.config.temperature,
      })
    } else if (this.config.model === LLMModels.GroqMetaLlamaLlama4Scout17b16eInstruct) {
      llm = new ChatOpenAI({
        apiKey: this.config.apiKey,
        model: this.config.model.replace(/^groq\//, ''),
        temperature: this.config.temperature,
        configuration: {
          baseURL: 'https://api.groq.com/openai/v1',
        },
      })
    } else {
      llm = new ChatOpenAI({
        apiKey: this.config.apiKey,
        model: this.config.model,
        temperature: this.config.model !== LLMModels.GptO3Mini ? this.config.temperature : undefined,
      })
    }

    // Bind structured output to the model
    const modelWithStructuredOutput = llm.withStructuredOutput(zodSchema)

    // Invoke the model with the prompt
    const messages = [
      new SystemMessage(
        `ROOT SYSTEM PROMPT:\n`
        + `Follow these rules precisely:\n`
        + `1. ALWAYS format your ENTIRE response as valid JSON according to the provided schema\n`
        + `2. Match ALL property names and types EXACTLY as defined in the schema\n`
        + `3. For string values, properly escape special characters (\\, \", \n, \r, \t, etc.)\n`
        + `4. If a property expects a specific data type, ensure your response uses that type\n`
        + `5. If the schema is empty, return a JSON object with a "note" field explaining this\n`
        + `6. DO NOT include any text, explanations or markdown outside the JSON structure\n`,
      ),
      new HumanMessage(this.prompt),
    ]

    try {
      // Use the abort signal for timeout handling
      const result = await modelWithStructuredOutput.invoke(messages, {
        signal: context.abortSignal,
      })

      return result || {}
    } catch (error) {
      await this.debugLog(context, `Error during model invocation: ${error}`)
      throw error
    }
  }

  private async debugLog(context: ExecutionContext, message: string): Promise<void> {
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

  private createZodSchemaFromPortSchema(portSchema: any): z.ZodType<any> {
    // Start with an empty object schema
    const schemaObj: Record<string, z.ZodTypeAny> = {}

    // Process each property in the port schema
    if (portSchema && portSchema.properties) {
      Object.entries(portSchema.properties).forEach(([key, propConfig]: [string, any]) => {
        // Create appropriate Zod schema based on property type
        switch (propConfig.type) {
          case 'string': {
            let stringSchema = z.string()
            // Add description if available
            if (propConfig.description) {
              stringSchema = stringSchema.describe(propConfig.description)
            }
            schemaObj[key] = stringSchema
            break
          }

          case 'number': {
            let numberSchema = z.number()
            // Add description if available
            if (propConfig.description) {
              numberSchema = numberSchema.describe(propConfig.description)
            }
            schemaObj[key] = numberSchema
            break
          }

          case 'boolean': {
            let boolSchema = z.boolean()
            // Add description if available
            if (propConfig.description) {
              boolSchema = boolSchema.describe(propConfig.description)
            }
            schemaObj[key] = boolSchema
            break
          }

          case 'array': {
            // Determine array item type if specified
            let itemSchema: z.ZodTypeAny = z.any()
            if (propConfig.itemConfig) {
              console.log(`[LLMCallWithStructuredOutput] Array item config: ${JSON.stringify(propConfig.itemConfig)}`)
              if (propConfig.itemConfig.type === 'string') {
                itemSchema = z.string()
              } else if (propConfig.itemConfig.type === 'number') {
                itemSchema = z.number()
              } else if (propConfig.itemConfig.type === 'boolean') {
                itemSchema = z.boolean()
              } else if (propConfig.itemConfig.type === 'object' && propConfig.itemConfig.schema) {
                itemSchema = this.createZodSchemaFromPortSchema(propConfig.itemConfig.schema)
              } else if (propConfig.itemConfig.type === 'array' && propConfig.itemConfig.schema) {
                itemSchema = this.createZodSchemaFromPortSchema(propConfig.itemConfig.schema)
              } else if (propConfig.itemConfig.type === 'enum') {
                // TODO: Handle enum types
              } else {
                // Fallback to any type for unknown item types
                itemSchema = z.string()
              }
            }

            // Create a basic array schema with the determined item type
            let arraySchema = z.array(itemSchema)

            // Add description if available
            if (propConfig.description) {
              arraySchema = arraySchema.describe(propConfig.description)
            }
            schemaObj[key] = arraySchema
            break
          }

          case 'object': {
            // For nested objects, recursively create a schema
            if (propConfig.schema && Object.keys(propConfig.schema.properties).length > 0) {
              schemaObj[key] = this.createZodSchemaFromPortSchema(propConfig.schema)
              if (propConfig.description) {
                schemaObj[key] = schemaObj[key].describe(propConfig.description)
              }
            } else {
              let recordSchema = z.record(z.any())
              // Add description if available
              if (propConfig.description) {
                recordSchema = recordSchema.describe(propConfig.description)
              }
              schemaObj[key] = recordSchema
            }
            break
          }

          default: {
            // For any other type, use any schema
            let anySchema = z.any()
            // Add description if available
            if (propConfig.description) {
              anySchema = anySchema.describe(propConfig.description)
            }
            schemaObj[key] = anySchema
          }
        }
      })
    }

    // Create the final Zod object schema
    return z.object(schemaObj)
  }
}

export default LLMCallWithStructuredOutputNode

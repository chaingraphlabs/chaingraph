/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArrayPortConfig,
  EncryptedSecretValue,
  EnumPortConfig,
  ExecutionContext,
  IObjectSchema,
  IPort,
  IPortConfig,
  NodeExecutionResult,
  ObjectPort,
  ObjectPortConfig,
} from '@badaitech/chaingraph-types'
import type { APIkey, SupportedProviders } from './llm-call.node'
import {
  ExecutionEventImpl,
} from '@badaitech/chaingraph-types'
import {
  ObjectSchemaCopyTo,
} from '@badaitech/chaingraph-types'
import {
  Passthrough,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  ExecutionEventEnum,
  Node,
  ObjectSchema,
  Output,
  PortEnumFromObject,
  PortNumber,
  PortObject,
  PortSecret,
  PortString,
} from '@badaitech/chaingraph-types'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatDeepSeek } from '@langchain/deepseek'
import { ChatGroq } from '@langchain/groq'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'
import { NODE_CATEGORIES } from '../../categories'
import { isOpenAI } from './llm-call.node'
import { isAnthropic, isDeepSeek, isGroq, isMoonshot, LLMModels, llmModels } from './llm-call.node'

const llmMaxRetries = 3

@ObjectSchema({
  description: 'Configuration for LLM Call with Structured Output Node',
  type: 'LLMConfig',
})
export class LLMConfig {
  @PortEnumFromObject(llmModels, {
    title: 'Model',
    description: 'Language Model to use',
  })
  model: LLMModels = LLMModels.Gpt5Mini

  @PortSecret<SupportedProviders>({
    title: 'API Key',
    description: 'LLM provider API Key',
    secretType: 'openai',
  })
  apiKey?: EncryptedSecretValue<SupportedProviders>

  @PortNumber({
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

@Node({
  type: 'LLMCallWithStructuredOutputNodeV2',
  title: 'LLM Call with Structured Output',
  description: 'Sends prompt to Language Model and parses the response into a structured format based on the defined schema',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'prompt', 'structured', 'schema', 'json', 'object'],
})
export class LLMCallWithStructuredOutputNodeV2 extends BaseNode {
  @Passthrough()
  @PortObject({
    schema: LLMConfig,
    title: 'LLM Configuration',
    description: 'Configuration for the LLM call',
  })
  config: LLMConfig = new LLMConfig()

  @Passthrough()
  @PortObject({
    title: 'Output Schema',
    description: 'Schema for the structured output from the LLM. You can connect object port to this port and it will be used to generate the schema.',
    schema: { properties: {} },
    isSchemaMutable: true,
    ui: {
      keyDeletable: true,
      hideEditor: false,
    },
  })
  @ObjectSchemaCopyTo((port: IPort): boolean => {
    return port.getConfig().key === 'structuredResponse' && !port.getConfig().parentId
  })
  outputSchema: Record<string, any> = {}

  @Passthrough()
  @PortString({
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
    isSchemaMutable: false,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      keyDeletable: false,
      hideEditor: false,
      hidePropertyEditor: true,
    },
  })
  structuredResponse: Record<string, any> = {}

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.config.apiKey) {
      throw new Error('API Key is required')
    }

    const { apiKey } = await this.config.apiKey.decrypt(context)

    try {
      // Generate structured response
      const structuredResponse = await this.generateStructuredResponse(context, apiKey)

      for (const [key, value] of Object.entries(structuredResponse)) {
        // Set the structured response in the output port
        this.structuredResponse[key] = value
      }

      await this.debugLog(context, `Final structured response: ${JSON.stringify(structuredResponse, null, 2)}`)

      return {}
    } catch (error: any) {
      const errorMessage = `Failed to generate structured output: ${error.message || PortString(error)}`
      await this.debugLog(context, `ERROR: ${errorMessage}`)
      console.error('Error processing structured output:', error)
      throw new Error(errorMessage)
    }
  }

  private async generateStructuredResponse(context: ExecutionContext, apiKey: APIkey): Promise<Record<string, any>> {
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
    const llm = createLLMInstance(this.config, apiKey)

    // Bind structured output to the model
    const modelWithStructuredOutput = llm.withStructuredOutput<Record<string, any>>(
      zodSchema,
      {
        method: isOpenAI(this.config.model) ? 'functionCalling' : 'functionCalling',
        strict: true,
        // strict: isOpenAI(this.config.model) ? undefined : true,
      },
    )

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

    return await this.invokeModelWithRetries(modelWithStructuredOutput, messages, context)
  }

  /**
   * Invoke the model with retries in case of failure
   */
  private async invokeModelWithRetries(
    model: any,
    messages: (SystemMessage | HumanMessage)[],
    context: ExecutionContext,
  ): Promise<Record<string, any>> {
    for (let i = 0; i < llmMaxRetries; i++) {
      try {
        // Use the abort signal for timeout handling
        const result = await model.invoke(messages, {
          signal: context.abortSignal,
        })

        return result || {}
      } catch (error) {
        if (i >= llmMaxRetries - 1) {
          await this.debugLog(context, `Error during model invocation: ${error}`)
          throw error
        } else {
          await this.debugLog(context, `Error during model invocation, retrying with feedback: ${error}`)

          messages.push(
            new HumanMessage(
              `ERROR: ${error}\n`
              + `Please provide a valid JSON response according to the schema.\n`,
            ),
          )
        }
      }
    }

    // This should never be reached due to the throw in the loop above,
    // but TypeScript needs it for type safety
    throw new Error('Maximum retries exceeded')
  }

  /**
   * Send a debug log event to the execution context
   */
  private async debugLog(context: ExecutionContext, message: string): Promise<void> {
    await context.sendEvent(
      new ExecutionEventImpl(
        0,
        ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
        new Date(),
        {
          nodeId: this.metadata.id || 'unknown',
          log: message,
        },
      ),
    )
  }

  /**
   * Main function to create a Zod schema from a port schema
   */
  private createZodSchemaFromPortSchema(portSchema: IObjectSchema): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const schemaObj: Record<string, z.ZodTypeAny> = {}

    if (!portSchema || !portSchema.properties) {
      return z.object({})
    }

    // Process each property in the port schema
    Object.entries(portSchema.properties).forEach(([key, propConfig]: [string, IPortConfig]) => {
      const zodSchema = this.createZodTypeForConfig(propConfig)
      if (zodSchema) {
        schemaObj[key] = zodSchema
      }
    })

    // Create the final Zod object schema
    return z.object(schemaObj)
  }

  /**
   * Dispatch to the appropriate schema creator based on property type
   */
  private createZodTypeForConfig(propConfig: IPortConfig): z.ZodTypeAny | null {
    if (!propConfig || !propConfig.type) {
      return null
    }

    switch (propConfig.type) {
      case 'string':
        return this.createStringSchema(propConfig)
      case 'number':
        return this.createNumberSchema(propConfig)
      case 'boolean':
        return this.createBooleanSchema(propConfig)
      case 'array':
        return this.createArraySchema(propConfig)
      case 'object':
        return this.createObjectSchema(propConfig)
      case 'enum':
        return this.createEnumSchema(propConfig)
      default:
        return this.createDefaultSchema(propConfig)
    }
  }

  /**
   * Create a Zod schema for string properties
   */
  private createStringSchema(config: IPortConfig): z.ZodNullable<z.ZodString> | z.ZodString {
    let schema = z.string()

    if (config.description) {
      schema = schema.describe(config.description)
    }

    if (!config.required) {
      return schema.nullable()
    }

    return schema
  }

  /**
   * Create a Zod schema for number properties
   */
  private createNumberSchema(config: IPortConfig): z.ZodNullable<z.ZodNumber> | z.ZodNumber {
    let schema = z.number()

    if (config.description) {
      schema = schema.describe(config.description)
    }

    if (!config.required) {
      return schema.nullable()
    }

    return schema
  }

  /**
   * Create a Zod schema for boolean properties
   */
  private createBooleanSchema(config: IPortConfig): z.ZodNullable<z.ZodBoolean> | z.ZodBoolean {
    let schema = z.boolean()

    if (config.description) {
      schema = schema.describe(config.description)
    }

    if (!config.required) {
      return schema.nullable()
    }

    return schema
  }

  /**
   * Create a Zod schema for array properties
   */
  private createArraySchema(config: ArrayPortConfig): z.ZodArray<z.ZodTypeAny> | z.ZodNullable<z.ZodArray<z.ZodTypeAny>> {
    // Determine the item schema
    let itemSchema: z.ZodTypeAny = z.any()

    if (config.itemConfig) {
      itemSchema = this.determineArrayItemSchema(config.itemConfig)
    }

    // Create array schema with the determined item type
    let arraySchema = z.array(itemSchema)

    if (config.description) {
      arraySchema = arraySchema.describe(config.description)
    }

    if (!config.required) {
      return arraySchema.nullable()
    }

    return arraySchema
  }

  /**
   * Determine the schema for array items based on their configuration
   */
  private determineArrayItemSchema(itemConfig: IPortConfig): z.ZodTypeAny {
    if (!itemConfig.type) {
      return z.any()
    }

    switch (itemConfig.type) {
      case 'string':
        return z.string()
      case 'number':
        return z.number()
      case 'boolean':
        return z.boolean()
      case 'object':
        if (itemConfig.schema) {
          return this.createZodSchemaFromPortSchema(itemConfig.schema)
        }
        return z.object({})
      case 'array':
        if (itemConfig.itemConfig) {
          return z.array(this.determineArrayItemSchema(itemConfig.itemConfig))
        }
        return z.array(z.any())
      case 'enum':
        // Create enum schema from options if available
        if (itemConfig.options && itemConfig.options.length > 0) {
          const enumValues = itemConfig.options.map(opt =>
            opt.defaultValue ? PortString(opt.defaultValue) : '',
          ).filter(Boolean)

          if (enumValues.length > 0) {
            return z.enum(enumValues as [string, ...string[]])
          }
        }
        return z.string()
      default:
        return z.any()
    }
  }

  /**
   * Create a Zod schema for object properties
   */
  private createObjectSchema(config: ObjectPortConfig): z.ZodTypeAny {
    // For nested objects, recursively create a schema
    if (config.schema && Object.keys(config.schema.properties || {}).length > 0) {
      let objSchema = this.createZodSchemaFromPortSchema(config.schema)

      if (config.description) {
        objSchema = objSchema.describe(config.description)
      }

      if (!config.required) {
        return objSchema.nullable()
      }

      return objSchema
    }

    // For objects without defined properties, use a generic record schema
    let recordSchema = z.record(z.any())
    // let recordSchema = z.record(z.unknown())

    if (config.description) {
      recordSchema = recordSchema.describe(config.description)
    }

    if (!config.required) {
      return recordSchema.nullable()
    }

    return recordSchema
  }

  /**
   * Create a Zod schema for enum properties
   */
  private createEnumSchema(config: EnumPortConfig): z.ZodEnum<[string, ...string[]]> | z.ZodString | z.ZodNullable<z.ZodEnum<[string, ...string[]]>> {
    const enumValues = config.options.map((option) => {
      return option.defaultValue.toString() || ''
    }) as [string, ...string[]]

    let enumSchema = z.enum(enumValues)

    // Add description if available
    if (config.description) {
      enumSchema = enumSchema.describe(config.description)
    }

    if (!config.required) {
      return enumSchema.nullable()
    }

    return enumSchema
  }

  /**
   * Create a default Zod schema for unknown types
   */
  private createDefaultSchema(config: IPortConfig): z.ZodTypeAny {
    let schema = z.any()

    if (config.description) {
      schema = schema.describe(config.description)
    }

    if (!config.required) {
      return schema.nullable()
    }

    return schema
  }
}

/**
 * Create an LLM instance based on the selected model.
 */
export function createLLMInstance(config: LLMConfig, apiKey: APIkey): ChatOpenAI | ChatAnthropic | ChatDeepSeek | ChatGroq {
  if (isDeepSeek(config.model)) {
    return new ChatDeepSeek({
      apiKey,
      model: config.model,
      temperature: config.temperature,
      maxRetries: llmMaxRetries,
    })
  }

  if (isAnthropic(config.model)) {
    return new ChatAnthropic({
      apiKey,
      model: config.model,
      temperature: config.temperature,
      maxRetries: llmMaxRetries,
    })
  }

  if (isGroq(config.model)) {
    return new ChatGroq({
      apiKey,
      model: config.model.replace(/^groq\//, ''),
      temperature: config.temperature,
      maxRetries: llmMaxRetries,
    })
  }

  if (isMoonshot(config.model)) {
    return new ChatOpenAI({
      apiKey,
      model: config.model,
      temperature: config.temperature,
      streaming: true,
      configuration: {
        baseURL: 'https://api.moonshot.ai/v1',
      },
    })
  }

  return new ChatOpenAI({
    apiKey,
    model: config.model,
    temperature: config.model !== LLMModels.GptO3Mini ? config.temperature : undefined,
    maxRetries: llmMaxRetries,
  })
}

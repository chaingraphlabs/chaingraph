/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArchAIContext,
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import {
  PortVisibility,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortAny,
  PortBoolean,
  PortEnum,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { getNamespaceInput } from './set-variable.node'
import { VariableNamespace, VariableValueType } from './types'

/**
 * Node for appending values to variables
 * - For arrays: adds an element to the array
 * - For numbers: sums the current value with the value to append
 * - For strings: concatenates the values
 * - Can optionally create the variable if it doesn't exist with a specified initial value
 */
@Node({
  type: 'AppendVariableNode',
  title: 'ArchAI Append Variable',
  description: 'Appends a value to an existing variable (arrays, numbers, or strings). Can optionally create the variable if it doesn\'t exist with a specified initial value.',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['variable', 'append', 'array', 'number', 'string', 'concatenate', 'create'],
})
export class AppendVariableNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Variable Name',
    description: 'Name of the variable to append to',
    required: true,
  })
  name: string = ''

  @Input()
  @PortEnum({
    title: 'Namespace',
    description: 'Namespace to retrieve the variable from',
    defaultValue: VariableNamespace.Chat,
    required: true,
    options: [
      {
        id: VariableNamespace.Execution,
        type: 'string',
        defaultValue: VariableNamespace.Execution,
        title: 'Execution',
      },
      {
        id: VariableNamespace.Agent,
        type: 'string',
        defaultValue: VariableNamespace.Agent,
        title: 'Agent',
      },
      {
        id: VariableNamespace.Chat,
        type: 'string',
        defaultValue: VariableNamespace.Chat,
        title: 'Chat',
      },
      {
        id: VariableNamespace.ChatAgent,
        type: 'string',
        defaultValue: VariableNamespace.ChatAgent,
        title: 'Chat Agent',
      },
    ],
  })
  namespace: VariableNamespace = VariableNamespace.Chat

  @Input()
  @PortEnum({
    title: 'Variable Type',
    description: 'Type of the variable to append to',
    options: [
      {
        id: VariableValueType.Array,
        type: 'string',
        defaultValue: VariableValueType.Array,
        title: 'Array',
      },
      {
        id: VariableValueType.Number,
        type: 'string',
        defaultValue: VariableValueType.Number,
        title: 'Number',
      },
      {
        id: VariableValueType.String,
        type: 'string',
        defaultValue: VariableValueType.String,
        title: 'String',
      },
    ],
    required: true,
  })
  variableType: VariableValueType = VariableValueType.String

  @Input()
  @PortAny({
    title: 'Value to Append',
    description: 'Value to append to the variable. Must match the variable type.',
    required: true,
  })
  valueToAppend: any = null

  @Input()
  @PortBoolean({
    title: 'Create If Not Exists',
    description: 'If true, creates the variable if it does not exist instead of throwing an error',
    defaultValue: false,
  })
  createIfNotExists: boolean = false

  @Input()
  @PortVisibility({ showIf: node => (node as AppendVariableNode).createIfNotExists })
  @PortAny({
    title: 'Initial Value',
    description: 'Initial value to use when creating a variable if it does not exist. Must match the variable type.',
    required: false,
  })
  initialValue: any = null

  @Output()
  @PortAny({
    title: 'Result',
    description: 'The result of the append operation',
  })
  result: any = null

  @Output()
  @PortBoolean({
    title: 'Existed',
    description: 'Returns true if the variable existed at the moment of the execution start, false otherwise',
  })
  existed: boolean = false

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate inputs
    if (!this.name) {
      throw new Error('Variable name cannot be empty')
    }

    if (!this.variableType) {
      throw new Error('Variable type cannot be empty')
    }

    if (this.valueToAppend === null || this.valueToAppend === undefined) {
      throw new Error('Value to append cannot be null or undefined')
    }

    // Validate that the variable type is supported
    if (![VariableValueType.Array, VariableValueType.Number, VariableValueType.String].includes(this.variableType)) {
      throw new Error(`Unsupported variable type: ${this.variableType}. Only arrays, numbers, and strings are supported.`)
    }

    // Get required context information
    const archAIContext = context.getIntegration<ArchAIContext>('archai')
    const agentSession = archAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    // Create GraphQL client
    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    const namespace = getNamespaceInput(context, this.namespace)

    let getVariable: GraphQL.GetVariableQuery['getVariable'] | undefined
    try {
      ({ getVariable } = await graphQLClient.request(GraphQL.GetVariableDocument, {
        session: agentSession,
        namespace,
        key: this.name,
      }))
    } catch (e: unknown) {
      if (!isVariableNotFoundError(e)) {
        throw e
      }
    }

    let variable: GraphQL.VariableFieldsFragment | undefined
    let currentVariableType: string
    let currentValue: any
    let newValue: any
    let variableType: GraphQL.VariableType
    let serializedValue: string

    // Set the existed output port based on whether the variable existed at the start
    this.existed = !!getVariable?.variable

    if (!getVariable?.variable) {
      if (!this.createIfNotExists) {
        throw new Error(`Variable ${this.name} not found`)
      }

      // Create the variable if it doesn't exist and the flag is set
      // Initialize with the provided initial value or a default value based on the variable type
      switch (this.variableType) {
        case VariableValueType.Array:
          // Use initialValue if it's an array, otherwise use an empty array
          if (this.initialValue !== null && this.initialValue !== undefined && Array.isArray(this.initialValue)) {
            currentValue = this.initialValue
          } else {
            currentValue = []
          }
          currentVariableType = 'array'
          break
        case VariableValueType.Number:
          // Use initialValue if it's a number, otherwise use 0
          if (this.initialValue !== null && this.initialValue !== undefined && !Number.isNaN(Number(this.initialValue))) {
            currentValue = Number(this.initialValue)
          } else {
            currentValue = 0
          }
          currentVariableType = 'number'
          break
        case VariableValueType.String:
          // Use initialValue if it's provided, otherwise use empty string
          if (this.initialValue !== null && this.initialValue !== undefined) {
            currentValue = String(this.initialValue)
          } else {
            currentValue = ''
          }
          currentVariableType = 'string'
          break
        default:
          throw new Error(`Unsupported variable type for creation: ${this.variableType}`)
      }
    } else {
      variable = getVariable.variable as GraphQL.VariableFieldsFragment
      currentVariableType = variable.value.type
    }

    // Parse the current value based on its type
    if (currentVariableType === 'string' && this.variableType === VariableValueType.String) {
      if (variable) {
        currentValue = variable.value.value
      }
      // currentValue is already set to '' if we're creating a new variable

      // Validate that the value to append is a string or can be converted to a string
      const appendValue = String(this.valueToAppend)

      // Concatenate the strings
      newValue = currentValue + appendValue
      variableType = GraphQL.VariableType.String
      serializedValue = newValue
    } else if (currentVariableType === 'number' && this.variableType === VariableValueType.Number) {
      if (variable) {
        currentValue = Number(variable.value.value)
      }
      // currentValue is already set to 0 if we're creating a new variable

      // Validate that the value to append is a number or can be converted to a number
      const appendValue = Number(this.valueToAppend)
      if (Number.isNaN(appendValue)) {
        throw new TypeError('Value to append must be a valid number')
      }

      // Sum the numbers
      newValue = currentValue + appendValue
      variableType = GraphQL.VariableType.Number
      serializedValue = newValue.toString()
    } else if (currentVariableType === 'array' && this.variableType === VariableValueType.Array) {
      if (variable) {
        currentValue = JSON.parse(variable.value.value)

        // Validate that the current value is an array
        if (!Array.isArray(currentValue)) {
          throw new TypeError('Current variable value is not an array')
        }
      }
      // currentValue is already set to [] if we're creating a new variable

      // Add the element to the array
      newValue = [...currentValue, this.valueToAppend]
      variableType = GraphQL.VariableType.Array
      serializedValue = JSON.stringify(newValue)
    } else {
      // Type mismatch between retrieved variable and expected type
      throw new Error(`Type mismatch: Variable is of type ${currentVariableType} but expected ${this.variableType}`)
    }

    // Now set the updated value
    const { setVariable } = await graphQLClient.request(GraphQL.SetVariableDocument, {
      session: agentSession,
      namespace,
      key: this.name,
      value: {
        type: variableType,
        value: serializedValue,
      },
    })

    const updatedVariable = setVariable.variable as GraphQL.VariableFieldsFragment

    if (!updatedVariable || !updatedVariable.id) {
      throw new Error('Failed to update variable: Variable ID is empty')
    }

    // Set the result output port to the new value
    this.result = newValue

    return {}
  }
}

/**
 * Determines if the provided error object relates to a "get variable: record not found" error.
 */
function isVariableNotFoundError(e: unknown): e is { response: { errors: unknown[] } } {
  if (e !== null && typeof e === 'object' && 'response' in e) {
    const response = e.response
    if (response !== null && typeof response === 'object' && 'errors' in response) {
      const errors = response.errors
      if (errors !== null && Array.isArray(errors)) {
        if (errors.some((error: unknown) => {
          if (error === null || typeof error !== 'object') {
            return false
          }

          if (!('message' in error) || error.message !== 'get variable: record not found') {
            return false
          }

          return 'path' in error && Array.isArray(error.path) && error.path.length === 1 && error.path[0] === 'getVariable'
        })) {
          return true
        }
      }
    }
  }

  return false
}

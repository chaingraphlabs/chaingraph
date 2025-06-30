/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArchAIContext, ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import { BaseNode, Input, Node, PortAny, PortEnum, PortString } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { getNamespaceInput } from './set-variable.node'
import { VariableNamespace, VariableValueType } from './types'

/**
 * Node for appending values to variables
 * - For arrays: adds an element to the array
 * - For numbers: sums the current value with the value to append
 * - For strings: concatenates the values
 */
@Node({
  type: 'AppendVariableNode',
  title: 'ArchAI Append Variable',
  description: 'Appends a value to an existing variable (arrays, numbers, or strings)',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['variable', 'append', 'array', 'number', 'string', 'concatenate'],
  ui: {
    state: {
      isHidden: true, // Hide from the UI for now
    },
  },
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
      { id: VariableValueType.Array, type: 'string', defaultValue: VariableValueType.Array, title: 'Array' },
      { id: VariableValueType.Number, type: 'string', defaultValue: VariableValueType.Number, title: 'Number' },
      { id: VariableValueType.String, type: 'string', defaultValue: VariableValueType.String, title: 'String' },
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

    // First, get the current value of the variable
    const { getVariable } = await graphQLClient.request(GraphQL.GetVariableDocument, {
      session: agentSession,
      namespace,
      key: this.name,
    })

    if (!getVariable || !getVariable.variable) {
      throw new Error(`Variable ${this.name} not found`)
    }

    const variable = getVariable.variable as GraphQL.VariableFieldsFragment
    const currentVariableType = variable.value.type
    let currentValue: any
    let newValue: any
    let variableType: GraphQL.VariableType
    let serializedValue: string

    // Parse the current value based on its type
    if (currentVariableType === 'string' && this.variableType === VariableValueType.String) {
      currentValue = variable.value.value

      // Validate that the value to append is a string or can be converted to a string
      const appendValue = String(this.valueToAppend)

      // Concatenate the strings
      newValue = currentValue + appendValue
      variableType = GraphQL.VariableType.String
      serializedValue = newValue
    } else if (currentVariableType === 'number' && this.variableType === VariableValueType.Number) {
      currentValue = Number(variable.value.value)

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
      currentValue = JSON.parse(variable.value.value)

      // Validate that the current value is an array
      if (!Array.isArray(currentValue)) {
        throw new TypeError('Current variable value is not an array')
      }

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

    return {}
  }
}

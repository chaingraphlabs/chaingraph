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
import { VariableNamespace } from './types'

/**
 * Node for setting a variable value in a specified namespace in ArchAI
 */
@Node({
  type: 'ArchAISetVariableNode',
  title: 'ArchAI Set Variable',
  description: 'Sets a variable value in a specified namespace in ArchAI',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['variable', 'set', 'storage', 'namespace'],
})
class ArchAISetVariableNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Variable Name',
    description: 'Name of the variable to set',
    required: true,
  })
  name: string = ''

  @Input()
  @PortEnum({
    title: 'Namespace',
    description: 'Namespace to set the variable in',
    defaultValue: VariableNamespace.Execution,
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
    required: true,
  })
  namespace: VariableNamespace = VariableNamespace.Execution

  @Input()
  @PortAny({
    title: 'Value',
    description: 'Value to set. Types are inferred automatically from JSON types: strings (use quotes), numbers (no quotes), booleans (true/false), arrays, and objects. Examples: "text" (string), 42 (number), true (boolean), [1,2,3] (array), {"key":"value"} (object).',
    required: true,
  })
  value: any = null

  @Output()
  @PortBoolean({
    title: 'Success',
    description: 'Indicates whether the variable was successfully set',
  })
  success: boolean = false

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate inputs
    if (!this.name) {
      throw new Error('Variable name cannot be empty')
    }

    if (!this.namespace) {
      throw new Error('Namespace cannot be empty')
    }

    if (this.value === null || this.value === undefined) {
      throw new Error('Value cannot be null or undefined')
    }

    // Get required context information
    const archAIContext = context.getIntegration<ArchAIContext>('archai')
    const agentSession = archAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    // Determine variable type and serialize value
    let variableType: GraphQL.VariableType
    let serializedValue: string

    const valueType = typeof this.value

    if (valueType === 'string') {
      variableType = GraphQL.VariableType.String
      serializedValue = this.value
    } else if (valueType === 'number') {
      variableType = GraphQL.VariableType.Number
      serializedValue = this.value.toString()
    } else if (valueType === 'boolean') {
      variableType = GraphQL.VariableType.Boolean
      serializedValue = this.value ? 'true' : 'false'
    } else if (Array.isArray(this.value)) {
      variableType = GraphQL.VariableType.Array
      serializedValue = JSON.stringify(this.value)
    } else if (valueType === 'object' && this.value !== null) {
      variableType = GraphQL.VariableType.Object
      serializedValue = JSON.stringify(this.value)
    } else {
      throw new Error(`Value type is not supported: ${valueType}`)
    }

    // Create GraphQL client
    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    const { setVariable } = await graphQLClient.request(GraphQL.SetVariableDocument, {
      session: agentSession,
      namespace: getNamespaceInput(context, this.namespace),
      key: this.name,
      value: {
        type: variableType,
        value: serializedValue,
      },
    })

    const variable = setVariable.variable as GraphQL.VariableFieldsFragment

    if (!variable || !variable.id) {
      throw new Error('Failed to set variable: Variable ID is empty')
    }

    // Set the success flag to true since the variable was successfully set
    this.success = true

    return {}
  }
}

export default ArchAISetVariableNode

export function getNamespaceInput(context: ExecutionContext, namespace: VariableNamespace): GraphQL.NamespaceInput {
  const archAIContext = context.getIntegration<ArchAIContext>('archai')

  switch (namespace) {
    case VariableNamespace.Local:
      return {
        type: GraphQL.NamespaceType.Execution,
        executionID: context.executionId,
      }
    case VariableNamespace.Execution:
      return {
        type: GraphQL.NamespaceType.Execution,
        executionID: context.rootExecutionId,
      }
    case VariableNamespace.Agent:
      return {
        type: GraphQL.NamespaceType.Agent,
        agentID: archAIContext?.agentID,
      }
    case VariableNamespace.Chat:
      return {
        type: GraphQL.NamespaceType.Chat,
        chatID: archAIContext?.chatID,
      }
    case VariableNamespace.ChatAgent:
      return {
        type: GraphQL.NamespaceType.ChatAgent,
        agentID: archAIContext?.agentID,
        chatID: archAIContext?.chatID,
      }
    default:
      throw new Error(`Unsupported namespace: ${namespace}`)
  }
}

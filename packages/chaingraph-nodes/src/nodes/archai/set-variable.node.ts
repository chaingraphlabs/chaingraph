/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import {
  BaseNode,
  Input,
  Node,
  PortAny,
  PortEnum,
  String,
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
  @String({
    title: 'Variable Name',
    description: 'Name of the variable to set',
    required: true,
  })
  name: string = ''

  @Input()
  @PortEnum({
    title: 'Namespace',
    description: 'Namespace to set the variable in',
    defaultValue: VariableNamespace.Chat,
    options: [
      { id: VariableNamespace.Execution, type: 'string', defaultValue: VariableNamespace.Execution, title: 'Execution' },
      { id: VariableNamespace.Agent, type: 'string', defaultValue: VariableNamespace.Agent, title: 'Agent' },
      { id: VariableNamespace.Chat, type: 'string', defaultValue: VariableNamespace.Chat, title: 'Chat' },
      { id: VariableNamespace.ChatAgent, type: 'string', defaultValue: VariableNamespace.ChatAgent, title: 'Chat Agent' },
    ],
  })
  namespace: string = VariableNamespace.Chat

  @Input()
  @PortAny({
    title: 'Value',
    description: 'Value to set (supports string, number, boolean, array, object)',
    required: true,
  })
  value: any = null

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    console.log(`[SET VARIABLE] Executing node: ${this.name}`)

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
    const agentSession = context.badAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    // Determine namespace information for API call
    let namespaceType: GraphQL.NamespaceType | undefined
    let chatId: string | undefined
    let agentId: string | undefined
    let executionId: string | undefined

    if (this.namespace === VariableNamespace.Execution) {
      namespaceType = GraphQL.NamespaceType.Execution
      executionId = context.executionId
    } else if (this.namespace === VariableNamespace.Agent) {
      namespaceType = GraphQL.NamespaceType.Agent
      agentId = context.badAIContext?.agentID
    } else if (this.namespace === VariableNamespace.Chat) {
      namespaceType = GraphQL.NamespaceType.Chat
      chatId = context.badAIContext?.chatID
    } else if (this.namespace === VariableNamespace.ChatAgent) {
      namespaceType = GraphQL.NamespaceType.ChatAgent
      agentId = context.badAIContext?.agentID
      chatId = context.badAIContext?.chatID
    } else {
      throw new Error(`Invalid namespace type: ${this.namespace}`)
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

    // Set the variable through the API
    console.log(`[SET VARIABLE] Setting variable: ${JSON.stringify({
      session: agentSession,
      namespace: {
        type: namespaceType,
        chat_id: chatId,
        agent_id: agentId,
        execution_id: executionId,
      },
      key: this.name,
      value: {
        type: variableType,
        value: serializedValue,
      },
    }, null, 2)}`)

    const { setVariable } = await graphQLClient.request(GraphQL.SetVariableDocument, {
      session: agentSession,
      namespace: {
        type: namespaceType,
        // chat_id: chatId,
        // agent_id: agentId,
        // execution_id: executionId,
        chatID: chatId,
        agentID: agentId,
        executionID: executionId,
      },
      key: this.name,
      value: {
        type: variableType,
        value: serializedValue,
      },
    })

    const variable = setVariable.variable as GraphQL.VariableFieldsFragment

    if (!variable || !variable || !variable.id) {
      throw new Error('Failed to set variable: Variable ID is empty')
    }

    return {}
  }
}

export default ArchAISetVariableNode

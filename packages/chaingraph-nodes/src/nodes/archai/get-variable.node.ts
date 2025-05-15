/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPort,
  ArrayPortConfig,

  ExecutionContext,
  IPort,
  IPortConfig,
  NodeEvent,
  NodeExecutionResult,
  ObjectPortConfig,
  PortUpdateEvent,
} from '@badaitech/chaingraph-types'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import {
  PortFactory,
} from '@badaitech/chaingraph-types'
import {
  findPort,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Boolean,
  Input,
  Node,
  NodeEventType,
  Output,
  PortAny,
  PortEnum,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { VariableNamespace, VariableValueType } from './types'

/**
 * Node for retrieving a variable value from a specified namespace in ArchAI
 */
@Node({
  type: 'ArchAIGetVariableNode',
  title: 'ArchAI Get Variable',
  description: 'Retrieves a variable value from a specified namespace in ArchAI',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['variable', 'get', 'storage', 'namespace'],
})
class ArchAIGetVariableNode extends BaseNode {
  @Input()
  @String({
    title: 'Variable Name',
    description: 'Name of the variable to retrieve',
    required: true,
  })
  name: string = ''

  @Input()
  @PortEnum({
    title: 'Namespace',
    description: 'Namespace to retrieve the variable from',
    defaultValue: VariableNamespace.Chat,
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
    description: 'Type of the variable to retrieve',
    defaultValue: VariableValueType.Any,
    options: [
      {
        id: VariableValueType.String,
        type: 'string',
        defaultValue: VariableValueType.String,
        title: 'String',
      },
      {
        id: VariableValueType.Number,
        type: 'string',
        defaultValue: VariableValueType.Number,
        title: 'Number',
      },
      {
        id: VariableValueType.Boolean,
        type: 'string',
        defaultValue: VariableValueType.Boolean,
        title: 'Boolean',
      },
      {
        id: VariableValueType.Object,
        type: 'string',
        defaultValue: VariableValueType.Object,
        title: 'Object',
      },
      {
        id: VariableValueType.Array,
        type: 'string',
        defaultValue: VariableValueType.Array,
        title: 'Array',
      },
      {
        id: VariableValueType.Any,
        type: 'any',
        defaultValue: VariableValueType.Any,
        title: 'Any',
      },
    ],
  })
  variableType: VariableValueType = VariableValueType.Any

  @Input()
  @Boolean({
    title: 'Use Default Value',
    description: 'Whether to use the default value if the variable does not exist',
    defaultValue: false,
  })
  useDefaultValue: boolean = false

  @Input()
  @PortAny({
    title: 'Default Value',
    description: 'Default value to use if the variable does not exist and Use Default Value is true',
  })
  defaultValue: any = null

  @Output()
  @PortAny({
    title: 'Value',
    description: 'Retrieved variable value',
    underlyingType: undefined,
    ui: {
      hideEditor: false,
    },
  })
  variableValue: any = undefined

  @Output()
  @Boolean({
    title: 'Exists',
    description: 'Whether the variable exists',
    defaultValue: false,
  })
  exists: boolean = false

  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    // Handle port update events for variable type changes
    if (event.type === NodeEventType.PortUpdate) {
      const updateEvent = event as PortUpdateEvent
      const portConfig = updateEvent.port.getConfig()

      // Check if the updated port is the variableType port
      if (portConfig.key === 'variableType' && portConfig.direction === 'input') {
        await this.updateValuePortType()
      }

      if (
        portConfig.key === 'defaultValue'
        && portConfig.direction === 'input'
        && portConfig.type === 'any'
      ) {
        await this.updateDefaultValuePortType(updateEvent.port as AnyPort)
        await this.updateValuePortType(portConfig)
      }
    }
  }

  private async updateDefaultValuePortType(
    defaultValuePortFromEvent: AnyPort | undefined,
  ): Promise<void> {
    const defaultValuePort
      = defaultValuePortFromEvent
        ?? findPort(this, (port) => {
          return port.getConfig().key === 'defaultValue'
            && port.getConfig().direction === 'input'
            && !port.getConfig().parentId
            && port.getConfig().type === 'any'
        }) as AnyPort
    if (!defaultValuePort)
      return

    const variableTypePort = findPort(this, (port) => {
      return port.getConfig().key === 'variableType'
        && port.getConfig().direction === 'input'
        && !port.getConfig().parentId
    })
    if (!variableTypePort)
      return

    const defaultValueUnderlyingType = defaultValuePort.getRawConfig().underlyingType
    if (!defaultValueUnderlyingType || defaultValueUnderlyingType.type === 'any') {
      this.variableType = VariableValueType.Any

      // check if variableTypePort is hidden then show it
      if (variableTypePort.getConfig().ui?.hidden) {
        variableTypePort.setConfig({
          ...variableTypePort.getConfig(),
          ui: {
            ...variableTypePort.getConfig().ui,
            hidden: false,
          },
        })
        await this.updatePort(variableTypePort)
      }

      return
    }

    let targetVariableType: VariableValueType
    switch (defaultValueUnderlyingType.type) {
      case 'string':
        targetVariableType = VariableValueType.String
        break
      case 'number':
        targetVariableType = VariableValueType.Number
        break
      case 'boolean':
        targetVariableType = VariableValueType.Boolean
        break
      case 'object':
        targetVariableType = VariableValueType.Object
        break
      case 'array':
        targetVariableType = VariableValueType.Array
        break
      default:
        this.variableType = VariableValueType.Any

        // check if variableTypePort is hidden then show it
        if (variableTypePort.getConfig().ui?.hidden) {
          variableTypePort.setConfig({
            ...variableTypePort.getConfig(),
            ui: {
              ...variableTypePort.getConfig().ui,
              hidden: false,
            },
          })
          await this.updatePort(variableTypePort)
        }
        return
    }

    // check if variableTypePort is shown then hide it
    if (!variableTypePort.getConfig().ui?.hidden) {
      variableTypePort.setConfig({
        ...variableTypePort.getConfig(),
        ui: {
          ...variableTypePort.getConfig().ui,
          hidden: true,
        },
      })
      await this.updatePort(variableTypePort)
    }

    // const currentVariableType = this.variableType
    // if (currentVariableType === targetVariableType) {
    //   // no need to update anything
    //   return
    // }

    this.variableType = targetVariableType
  }

  /**
   * Updates the value output port's underlying type based on the selected variable type
   */
  private async updateValuePortType(
    targetUnderlyingConfig: IPortConfig | undefined = undefined,
  ): Promise<void> {
    const valuePort = findPort(this, (port) => {
      return port.getConfig().key === 'variableValue'
        && port.getConfig().direction === 'output'
        && !port.getConfig().parentId
    }) as AnyPort
    if (!valuePort)
      return

    const config = valuePort.getConfig()
    let underlyingType: IPortConfig | undefined

    // Set the underlying type based on the selected variable type
    switch (this.variableType) {
      case VariableValueType.String:
        console.log(`[ArchAIGetVariableNode] Updating underlying type to string`)

        underlyingType = {
          // ...config,
          ...PortFactory.create({
            type: 'string',
            defaultValue: targetUnderlyingConfig?.defaultValue ?? '',
          }).getConfig(),
        }
        break
      case VariableValueType.Number:
        console.log(`[ArchAIGetVariableNode] Updating underlying type to number`)
        underlyingType = {
          // ...config,
          ...PortFactory.create({
            type: 'number',
            defaultValue: targetUnderlyingConfig?.defaultValue ?? 0,
          }).getConfig(),
        }
        break
      case VariableValueType.Boolean:
        console.log(`[ArchAIGetVariableNode] Updating underlying type to boolean`)
        underlyingType = {
          // ...config,
          ...PortFactory.create({
            type: 'boolean',
            defaultValue: targetUnderlyingConfig?.defaultValue ?? false,
          }).getConfig(),
        }
        break
      case VariableValueType.Object:
        underlyingType = {
          // ...config,
          ...PortFactory.create({
            type: 'object',
            schema: (targetUnderlyingConfig as ObjectPortConfig)?.schema || {
              type: 'object',
              properties: {},
            },
            isSchemaMutable: true,
            defaultValue: targetUnderlyingConfig?.defaultValue ?? {},
            ui: {
              ...(targetUnderlyingConfig?.ui || {}),
              hideEditor: false,
              collapsed: true,
            },
          }).getConfig(),
        }
        console.log(`[ArchAIGetVariableNode] Updating underlying type to object: ${JSON.stringify(underlyingType)}`)
        break
      case VariableValueType.Array:
        console.log(`[ArchAIGetVariableNode] Updating underlying type to array`)
        underlyingType = {
          // ...config,
          ...PortFactory.create({
            type: 'array',
            itemConfig: (targetUnderlyingConfig as ArrayPortConfig)?.itemConfig || {
              type: 'any',
            },
            defaultValue: targetUnderlyingConfig?.defaultValue ?? [],
            ui: {
              ...(targetUnderlyingConfig?.ui || {}),
              hideEditor: false,
            },
          }).getConfig(),
        }
        break
      default:
        underlyingType = undefined
    }

    const currentUnderlyingType = valuePort.getRawConfig().underlyingType

    // check if underlyingType is changed
    if (underlyingType && currentUnderlyingType) {
      if (underlyingType.type === currentUnderlyingType.type) {
        // no need to update anything
        return
      }
    }
    if (!underlyingType && !currentUnderlyingType) {
      // no need to update anything
      return
    }

    // Update the port's configuration with the new underlying type
    valuePort.setUnderlyingType(underlyingType)

    // console.log(`[ArchAIGetVariableNode] Updated underlying type for variableValue port: ${JSON.stringify(underlyingType)}`)
    console.log(`[ArchAIGetVariableNode] Updated underlying type for variableValue port: ${JSON.stringify(valuePort.serialize())}`)

    // Reset value to match the new type
    // if (underlyingType) {
    //   valuePort.setValue(underlyingType.defaultValue ?? undefined)
    // } else {
    //   valuePort.setValue(undefined)
    // }

    // Update the port
    await this.updatePort(valuePort as IPort)
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Set default outputs
    this.variableValue = null

    // Check if default value should be returned
    const defaultValueResult = () => {
      if (this.useDefaultValue && this.defaultValue !== null) {
        this.variableValue = this.defaultValue
        return true
      }
      return false
    }

    // Validate inputs
    if (!this.name) {
      defaultValueResult()
      return {}
    }

    if (!this.namespace) {
      defaultValueResult()
      return {}
    }

    try {
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
      }

      if (!namespaceType) {
        throw new Error(`Invalid namespace type: ${this.namespace}`)
      }

      // Create GraphQL client
      const graphQLClient = createGraphQLClient(
        process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
      )

      // Request the variable from the API
      const { getVariable } = await graphQLClient.request(GraphQL.GetVariableDocument, {
        session: agentSession,
        namespace: {
          type: namespaceType,
          chatID: chatId,
          agentID: agentId,
          executionID: executionId,
        },
        key: this.name,
      })

      if (!getVariable || !getVariable.variable) {
        throw new Error(`Variable ${this.name} not found`)
      }

      const variable = getVariable.variable as GraphQL.VariableFieldsFragment
      const variableType = variable.value.type

      // Process variable based on its type
      this.exists = true

      // Parse variable value based on expected type
      if (variableType === 'string' && this.variableType === VariableValueType.String) {
        this.variableValue = variable.value.value
      } else if (variableType === 'number' && this.variableType === VariableValueType.Number) {
        this.variableValue = Number(variable.value.value)
      } else if (variableType === 'boolean' && this.variableType === VariableValueType.Boolean) {
        this.variableValue = variable.value.value === 'true'
          || variable.value.value === 'True'
          || variable.value.value === '1'
      } else if ((variableType === 'object' || variableType === 'array')
        && (this.variableType === VariableValueType.Object || this.variableType === VariableValueType.Array)) {
        try {
          this.variableValue = JSON.parse(variable.value.value)
        } catch (e) {
          throw new Error(`Failed to parse ${variableType} value: ${e}`)
        }
      } else {
        // Type mismatch between retrieved variable and expected type
        throw new Error(`Type mismatch: Variable is of type ${variableType} but expected ${this.variableType}`)
      }
    } catch (error: any) {
      this.exists = false
      if (!this.useDefaultValue) {
        throw error
      }

      defaultValueResult()
    }

    return {}
  }
}

export default ArchAIGetVariableNode

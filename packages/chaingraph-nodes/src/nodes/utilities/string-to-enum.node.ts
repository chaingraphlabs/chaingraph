/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  EnumPortConfig,
  ExecutionContext,
  INode,
  IPort,
  NodeEvent,
  NodeExecutionResult,
  PortConnectedEvent,
  PortDisconnectedEvent,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  NodeEventType,
  OnPortUpdate,
  Output,
  PortArray,
  PortEnum,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'StringToEnumNode',
  title: 'String to Enum',
  description: 'Converts a string input to an enum output with optional validation against allowed values.',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['conversion', 'string', 'enum', 'type', 'transform', 'validation'],
})
export class StringToEnumNode extends BaseNode {
  /**
   * The input string that will be converted to an enum
   */
  @Input()
  @PortString({
    title: 'String Input',
    description: 'The string value to convert to an enum',
    defaultValue: '',
    required: false,
  })
  inputString?: string

  /**
   * Optional array of allowed values for validation
   */
  @Input()
  @PortArray({
    title: 'Allowed Values',
    description: 'Optional array of allowed string values. If provided, the input will be validated against these values.',
    itemConfig: { type: 'string' },
    defaultValue: undefined,
    required: false,
    isMutable: true,
    ui: {
      hideEditor: false,
      addItemFormHidden: false,
    },
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    // Find the outputEnum port
    const outputPort = node.findPort(
      p => p.getConfig().key === 'outputEnum'
        && p.getConfig().direction === 'output',
    )

    if (!outputPort) {
      return
    }

    // Get the current port config
    const currentConfig = outputPort.getConfig()

    // Check if this is an enum port
    if (currentConfig.type !== 'enum') {
      return
    }

    // Get the current allowedValues array from the node
    const allowedValues = (node as StringToEnumNode).allowedValues

    // Create the updated enum config
    const updatedConfig: EnumPortConfig = {
      ...currentConfig as EnumPortConfig,
      options: [],
    }

    if (allowedValues && Array.isArray(allowedValues) && allowedValues.length > 0) {
      // Create enum options from the array values
      // Each string becomes an option with id and name being the same
      updatedConfig.options = allowedValues.map(value => ({
        type: 'string' as const,
        id: value,
        name: value,
        title: value,
        defaultValue: value,
        required: false,
      }))
    }

    // Update the port configuration
    outputPort.setConfig(updatedConfig)

    // Notify the framework that the port configuration has changed
    node.updatePort(outputPort)
  })
  allowedValues?: string[]

  /**
   * The output enum with the same value as the input string.
   *
   * Note: The empty options array is intentional. The Chaingraph framework
   * dynamically populates enum options at runtime based on the actual values
   * passed through the port. This allows the node to work with any string value
   * without predefined restrictions.
   */
  @Output()
  @PortEnum({
    title: 'Enum Output',
    description: 'The enum output with the same value as the input string',
    options: [], // Dynamic enum: populated at runtime by the framework
    defaultValue: undefined,
    required: false,
  })
  outputEnum?: string

  /**
   * Handle node events including port connections
   */
  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    if (event.type === NodeEventType.PortConnected) {
      await this.handlePortConnectedEvent(event as PortConnectedEvent)
    } else if (event.type === NodeEventType.PortDisconnected) {
      await this.handlePortDisconnectedEvent(event as PortDisconnectedEvent)
    }
  }

  /**
   * Handle when the outputEnum port is connected to another port
   */
  private async handlePortConnectedEvent(event: PortConnectedEvent): Promise<void> {
    // Check if the connection involves our outputEnum port
    if (event.sourceNode.id === this.id && event.sourcePort.key === 'outputEnum') {
      const targetPort = event.targetPort
      const targetConfig = targetPort.getConfig()

      // If the target is an enum port, extract its options
      if (targetConfig.type === 'enum') {
        const enumConfig = targetConfig as EnumPortConfig

        // Extract the option values (ids) from the enum configuration
        if (enumConfig.options && Array.isArray(enumConfig.options) && enumConfig.options.length > 0) {
          // Populate allowedValues with the enum option ids
          this.allowedValues = enumConfig.options.map((option) => {
            // The option might be a string or an object with an id
            if (typeof option === 'string') {
              return option
            } else if (option && typeof option === 'object' && 'id' in option) {
              return String(option.id)
            } else if (option && typeof option === 'object' && 'name' in option) {
              return String(option.name)
            }
            return ''
          }).filter(value => value !== '')

          console.log(`[StringToEnumNode] Connected to enum port with options:`, this.allowedValues)

          // Trigger the OnPortUpdate handler to update our outputEnum options
          const allowedValuesPort = this.findPort(
            p => p.getConfig().key === 'allowedValues',
          )
          if (allowedValuesPort) {
            // Update the port to trigger the OnPortUpdate decorator
            this.updatePort(allowedValuesPort)
          }
        }
      }
    }
  }

  /**
   * Handle when the outputEnum port is disconnected
   */
  private async handlePortDisconnectedEvent(event: PortDisconnectedEvent): Promise<void> {
    // Check if the disconnection involves our outputEnum port
    if (event.sourceNode.id === this.id && event.sourcePort.key === 'outputEnum') {
      // Clear the allowedValues when disconnected
      this.allowedValues = undefined

      console.log(`[StringToEnumNode] Disconnected, clearing allowedValues`)

      // Trigger the OnPortUpdate handler to reset our outputEnum options
      const allowedValuesPort = this.findPort(
        p => p.getConfig().key === 'allowedValues',
      )
      if (allowedValuesPort) {
        // Update the port to trigger the OnPortUpdate decorator
        this.updatePort(allowedValuesPort)
      }
    }
  }

  /**
   * Execute the node logic: convert the input string to an enum output
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle empty input: undefined, null, or empty string all clear the output
    // Empty strings are treated as no value to prevent downstream issues
    if (this.inputString === undefined || this.inputString === null || this.inputString === '') {
      this.outputEnum = undefined
      return {}
    }

    // If allowed values are provided, validate the input
    if (this.allowedValues && this.allowedValues.length > 0) {
      // Use Set for O(1) lookup performance with large arrays
      const allowedSet = new Set(this.allowedValues)
      if (!allowedSet.has(this.inputString)) {
        // Limit displayed values to prevent overly long error messages
        const maxDisplay = 10
        const displayValues = this.allowedValues.length <= maxDisplay
          ? this.allowedValues.join(', ')
          : `${this.allowedValues.slice(0, maxDisplay).join(', ')}... (${this.allowedValues.length} total)`
        throw new Error(`Invalid value: "${this.inputString}". Allowed values are: ${displayValues}`)
      }
    }

    // Set the enum output to the input string value
    this.outputEnum = this.inputString

    return {}
  }
}

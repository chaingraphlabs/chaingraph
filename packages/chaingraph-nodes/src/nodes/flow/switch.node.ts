/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeEvent,
  NodeExecutionResult,
  PortCreateEvent,
} from '@badaitech/chaingraph-types'
import {
} from '@badaitech/chaingraph-types'
import {
  NodeEventType,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortObject,
  String,
  Boolean,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

/**
 * Switch Node - Controls flow based on matching a string value with a list of case values, if no matches found the default value will be set to true
 */
@Node({
  type: 'SwitchNode',
  title: 'Switch',
  description: 'Controls flow based on matching a string value with a list of case values, if no matches found the default value will be used.',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'condition', 'switch', 'logic'],
})
class SwitchNode extends BaseNode {
  @Input()
  @String({
    title: 'Input',
    description: 'String value to use for matching a list of case values',
    defaultValue: '',
  })
  input: string = ''

  @Output()
  @PortObject({
    title: 'Cases',
    description: 'Case values to use to match with the input value',
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      collapsed: true,
      hidePort: true,
      keyDeletable: true,
      hideEditor: false,
      hidePropertyEditor: true,
      enumValues: ['boolean'],
    },
  })
  caseObject: Record<string, boolean> = {}

  @Output()
  @Boolean({
    title: 'Default',
    description: 'Whether the string value matches none of the case values',
  })
  default: boolean = false

  // ------------------------------------------------------------------------------
  // EXECUTION & EVENT HANDLING
  // ------------------------------------------------------------------------------

  /**
   * Execute the node by matching input value with the case values and set the ports to true if a case matches. If none the default port will be set to true
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const keys: string[] = Object.keys(this.caseObject)
    for (const key of keys) {
      try {
        if (typeof this.caseObject[key] !== 'boolean') {
          continue
        }
        this.caseObject[key] = this.input === key
      } catch (error) {
        this.logError(`Error matching case value ${key} with input value ${this.input}:`, error)
      }
    }
    this.default = !keys.includes(this.input)

    return {}
  }

  /**
   * Log an error with node context
   */
  private logError(message: string, error: any): void {
    console.error(`[GateNode ${this.id}] ${message}`, error)
  }
}

export default SwitchNode


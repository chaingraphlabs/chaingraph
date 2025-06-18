/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, PortAny, PortBoolean, PortString } from '@badaitech/chaingraph-types'

@Node({
  type: 'JSONSerializerNode',
  title: 'JSON Serializer',
  description: 'Converts any data structure to a JSON string',
  category: 'utilities',
  tags: ['json', 'serialize', 'conversion', 'format'],
})
export class JSONSerializerNode extends BaseNode {
  /**
   * The input data that will be serialized to JSON.
   * Can be any valid JavaScript value (object, array, string, number, etc.)
   */
  @Input()
  @PortAny({
    title: 'Data',
    description: 'The data to convert to JSON',
    defaultValue: undefined,
    required: false,
  })
  data?: any

  /**
   * Controls whether the output JSON should be pretty-printed with indentation
   */
  @Input()
  @PortBoolean({
    title: 'Pretty Print',
    description: 'Format the JSON with indentation for better readability',
  })
  pretty: boolean = true

  /**
   * The output JSON string representation of the input data
   */
  @Output()
  @PortString({
    title: 'JSON',
    description: 'The serialized JSON string',
    defaultValue: '',
    ui: {
      isTextArea: true,
      textareaDimensions: { width: 300, height: 120 },
    },
    required: false,
  })
  json?: string

  /**
   * Execute the node logic: convert the input data to a JSON string
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      // Handle a null/undefined case
      if (this.data === null || this.data === undefined) {
        this.json = JSON.stringify(null)
        return {}
      }

      // Determine indentation based on pretty print flag
      const indent = this.pretty ? 2 : undefined

      // Serialize the data to JSON with optional pretty-printing
      this.json = JSON.stringify(this.data, null, indent)

      return {}
    } catch (error) {
      this.json = undefined
      throw error
    }
  }
}

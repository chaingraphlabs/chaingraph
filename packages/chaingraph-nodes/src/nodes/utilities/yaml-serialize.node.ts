/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, PortAny, PortBoolean, PortString } from '@badaitech/chaingraph-types'
import { stringify } from 'yaml'

@Node({
  type: 'YAMLSerializerNode',
  title: 'YAML Serializer',
  description: 'Converts any data structure to a YAML string',
  category: 'utilities',
  tags: ['yaml', 'serialize', 'conversion', 'format'],
})
export class YAMLSerializerNode extends BaseNode {
  /**
   * The input data that will be serialized to YAML.
   * Can be any valid JavaScript value (object, array, string, number, etc.)
   */
  @Input()
  @PortAny({
    title: 'Data',
    description: 'The data to convert to YAML',
    defaultValue: undefined,
    required: false,
  })
  data?: any

  /**
   * Controls whether document directives are included in the output
   */
  @Input()
  @PortBoolean({
    title: 'Include Directives',
    description: 'Include YAML document directives in the output',
  })
  includeDirectives: boolean = false

  /**
   * Controls whether to quote strings that resemble YAML keywords
   */
  @Input()
  @PortBoolean({
    title: 'Quote Strings',
    description: 'Quote strings that might be interpreted as YAML keywords',
  })
  quotingStrings: boolean = false

  /**
   * The output YAML string representation of the input data
   */
  @Output()
  @PortString({
    title: 'YAML',
    description: 'The serialized YAML string',
  })
  yaml?: string

  /**
   * Execute the node logic: convert the input data to a YAML string
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      // Handle null/undefined case
      if (this.data === null || this.data === undefined) {
        this.yaml = 'null'
        return {}
      }

      // Construct options for YAML stringification
      const options = {
        directives: this.includeDirectives,
        // Always include document start marker if directives are enabled
        ...(this.includeDirectives && { directives: true }),
        // Control string quoting behavior
        quotingType: this.quotingStrings ? '"' : '',
      }

      // Serialize the data to YAML
      this.yaml = stringify(this.data, options)

      return {}
    } catch (error) {
      this.yaml = undefined
      throw error
    }
  }
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortEnum,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { ToolSchemaProperty } from './types'

@Node({
  type: 'AntropicSchemaPropertyNode',
  title: 'Anthropic Schema Property',
  description: 'Creates a property definition for a tool\'s input schema',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['anthropic', 'tool', 'schema', 'property'],
})
class AntropicSchemaPropertyNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Property Name',
    description: 'The name of the schema property',
    required: true,
  })
  name: string = ''

  @Input()
  @PortEnum({
    title: 'Type',
    description: 'Data type of the property',
    options: [
      { id: 'string', type: 'string', defaultValue: 'string', title: 'String' },
      { id: 'number', type: 'string', defaultValue: 'number', title: 'Number' },
      { id: 'boolean', type: 'string', defaultValue: 'boolean', title: 'Boolean' },
      { id: 'object', type: 'string', defaultValue: 'object', title: 'Object' },
      { id: 'array', type: 'string', defaultValue: 'array', title: 'Array' },
    ],
    defaultValue: 'string',
    required: true,
  })
  type: string = 'string'

  @Input()
  @PortString({
    title: 'Description',
    description: 'Description of what this property is for',
    ui: {
      isTextArea: true,
    },
    required: true,
  })
  description: string = ''

  @Output()
  @PortObject({
    title: 'Property',
    description: 'The schema property definition',
    schema: ToolSchemaProperty,
    ui: {
      hidePropertyEditor: true,
    },
  })
  property: ToolSchemaProperty = new ToolSchemaProperty()

  @Output()
  @PortString({
    title: 'Property Name',
    description: 'Name of the property (for use with required properties)',
  })
  propertyName: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Create the property
    this.property = new ToolSchemaProperty()
    this.property.type = this.type
    this.property.description = this.description

    // Output the property name for use with required properties
    this.propertyName = this.name

    return {}
  }
}

export default AntropicSchemaPropertyNode

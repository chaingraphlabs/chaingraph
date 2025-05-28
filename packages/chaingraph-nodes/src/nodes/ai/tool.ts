/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ObjectSchema, PortObject, String } from '@badaitech/chaingraph-types'

@ObjectSchema({
  description: 'Tool definition for LLM',
})
export class ToolDefinition {
  @String({
    title: 'Tool Name',
    description: 'The name of the tool',
    minLength: 1,
    ui: {
      hideEditor: false,
    },
    order: 1,
  })
  name: string = ''

  @String({
    title: 'Description',
    description: 'A description of what the tool does',
    ui: {
      hideEditor: false,
      isTextArea: true,
    },
    order: 2,
  })
  description: string = ''

  @PortObject({
    title: 'Parameters Schema',
    description: 'Schema for the tool parameters',
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      keyDeletable: true,
      hideEditor: false,
      collapsed: true,
    },
    order: 3,
  })
  parameters: Record<string, any> = {}

  @PortObject({
    title: 'Response Schema',
    description: 'Schema for the tool response',
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      keyDeletable: true,
      hideEditor: false,
      collapsed: true,
    },
    order: 4,
  })
  response: Record<string, any> = {}

  constructor(
    name: string = '',
    description: string = '',
    parameters: Record<string, any> = {},
  ) {
    this.name = name
    this.description = description
    this.parameters = parameters
  }
}

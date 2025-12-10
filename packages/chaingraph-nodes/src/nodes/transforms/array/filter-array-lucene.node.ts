/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArrayPort, ExecutionContext, INode, IPort, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, deepCopy, Input, Node, OnPortUpdate, Output, PortArray, PortString } from '@badaitech/chaingraph-types'
import { filter, QueryParser } from 'lucene-kit'

import { NODE_CATEGORIES } from '../../../categories'

/**
 * Filter node that applies Lucene-style query syntax to filter arrays of objects
 */
@Node({
  type: 'FilterArrayLuceneNode',
  title: 'Filter Array (Lucene)',
  description: 'Filter an array of objects using Lucene-style query syntax, allowing for complex searches and filtering based on multiple fields and conditions.',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['filter', 'array', 'query', 'search', 'lucene'],
})
export class FilterArrayLuceneNode extends BaseNode {
  @Input()
  @PortArray({
    title: 'Input Array',
    description: 'Array of objects to filter',
    defaultValue: [],
    itemConfig: {
      type: 'any',
    },
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    const arrayPort = port as ArrayPort
    const resultPort = node.findPort(
      p => p.getConfig().key === 'filteredArray'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (!resultPort) {
      return
    }

    // Use first array's itemConfig for the result
    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: deepCopy(arrayPort.getConfig().itemConfig),
    })
    node.updateArrayItemConfig(resultPort as IPort)
  })
  inputArray: any[] = []

  @Input()
  @PortString({
    title: 'Query Lucene',
    description: 'Lucene-style query string (e.g., "text:*hello* AND NOT is_system:true"). Check the https://github.com/oxdev03/lucene-kit for more details.',
    defaultValue: '',
    ui: {
      isTextArea: true,
      textareaDimensions: { height: 80 },
    },
  })
  query: string = ''

  @Output()
  @PortArray({
    title: 'Filtered Array',
    description: 'Array of objects that match the query',
    defaultValue: [],
    itemConfig: {
      type: 'any',
    },
    isSchemaMutable: true,
  })
  filteredArray: any[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Reset outputs
    this.filteredArray = []

    // Validate inputs
    if (!this.inputArray || !Array.isArray(this.inputArray)) {
      throw new Error('Input is not a valid array')
    }

    // Empty query returns all items
    if (!this.query || this.query.trim() === '') {
      this.filteredArray = [...this.inputArray]
      return {}
    }

    try {
      // Create query parser
      const queryParser = new QueryParser(this.query)

      // Apply filter using lucene-kit
      this.filteredArray = filter(queryParser, this.inputArray)

      return {}
    } catch (error) {
      throw new Error(`Error during filtering: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
    }
  }
}

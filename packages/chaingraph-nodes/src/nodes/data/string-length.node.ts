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
  PortNumber,
  PortString,
} from '@badaitech/chaingraph-types'

@Node({
  type: 'StringLengthNode',
  title: 'String Length',
  description: 'Get the length (number of characters) of a string',
  category: 'data',
  tags: ['string', 'length', 'count', 'size', 'characters'],
})
export class StringLengthNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Text',
    description: 'The string to measure',
    defaultValue: '',
    required: false,
  })
  text: string = ''

  @Output()
  @PortNumber({
    title: 'Length',
    description: 'The number of characters in the string',
    defaultValue: 0,
    required: true,
  })
  length: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.length = this.text?.length ?? 0
    return {}
  }
}

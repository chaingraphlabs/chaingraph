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
  MultiChannel,
  Node,
  Output,
  PortStream,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Stream Buffer',
  description: 'Collects strings from a stream and concatenates them into a single string.',
  category: NODE_CATEGORIES.DATA,
})
class StreamBufferNode extends BaseNode {
  // Input stream port that accepts strings
  @Input()
  @PortStream({
    title: 'Input Stream',
    description: 'Stream of strings to collect',
    itemConfig: {
      type: 'string',
    },
  })
  public inputStream: MultiChannel<string> = new MultiChannel<string>()

  // Optional configuration for separator between strings
  @Input()
  @String({
    title: 'Separator',
    description: 'String to insert between concatenated values (e.g., newline or space)',
    defaultValue: '',
  })
  public separator: string = ''

  // Output port for the concatenated result
  @Output()
  @String({
    title: 'Buffered Output',
    description: 'All received strings concatenated together',
    defaultValue: '',
  })
  public buffer: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const accumulated: string[] = []

    for await (const value of this.inputStream) {
      accumulated.push(value)
    }

    this.buffer = accumulated.join(this.separator)

    return {}
  }
}

export default StreamBufferNode

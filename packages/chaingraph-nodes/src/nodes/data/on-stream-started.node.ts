/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { Boolean } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  MultiChannel,
  Node,
  Output,
  PortStream,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'OnStreamStarted',
  title: 'On Stream Started',
  description: 'Handles the start of a stream (first element received) and returns the boolean flag',
  category: NODE_CATEGORIES.DATA,
})
class OnStreamStartedNode extends BaseNode {
  // Input stream port that accepts strings
  @Input()
  @PortStream({
    title: 'Input Stream',
    description: 'Stream to watch',
    itemConfig: {
      type: 'any',
    },
  })
  public inputStream: MultiChannel<any> = new MultiChannel<any>()

  // Output port for the concatenated result
  @Output()
  @Boolean({
    title: 'Is Stream Started',
    description: 'Indicates if the stream has started',
    defaultValue: false,
  })
  public isStreamStarted: boolean = false

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const iterator = this.inputStream[Symbol.asyncIterator]()
    const firstValue = await iterator.next()
    if (!firstValue.done) {
      this.isStreamStarted = true
    }

    const streamError = this.inputStream.getError()
    if (streamError) {
      throw streamError
    }

    return {}
  }
}

export default OnStreamStartedNode

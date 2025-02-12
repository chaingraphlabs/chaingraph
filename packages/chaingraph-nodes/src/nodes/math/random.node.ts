/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types';
import {
  BaseNode,
  Input,
  Node,
  NodeExecutionStatus,
  Output,
  String,
} from '@badaitech/chaingraph-types';
import { NODE_CATEGORIES } from '../../categories';

@Node({
  title: 'RandomNumber',
  description: 'Generate a random integer within a given range',
  category: NODE_CATEGORIES.MATH,
  tags: ['math', 'random', 'number'],
})
class RandomNode extends BaseNode {
  @Input()
  @String({
    title: 'Range From',
    description: 'Minimum value for the random number (as a string)',
  })
  rangeFrom: string = '0';

  @Input()
  @String({
    title: 'Range To',
    description: 'Maximum value for the random number (as a string)',
  })
  rangeTo: string = '100';

  @Output()
  @String({
    title: 'Result Number',
    description: 'Generated random integer (as a string)',
  })
  result: string = '0';

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const min = parseInt(this.rangeFrom, 10) || 0;
    const max = parseInt(this.rangeTo, 10) || 100;
    const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
    this.result = randomValue.toString();

    console.log(`Generated random number: ${this.result}`);

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    };
  }
}

export default RandomNode;

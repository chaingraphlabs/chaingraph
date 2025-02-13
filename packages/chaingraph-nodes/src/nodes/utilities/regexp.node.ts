/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types';
import { BaseNode, Input, Node, NodeExecutionStatus, Output, String } from '@badaitech/chaingraph-types';
import { NODE_CATEGORIES } from '../../categories';

@Node({
  title: 'Regular Expression Filter',
  description: 'Filters input text using a regular expression',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['regex', 'filter', 'text'],
})
class RegExpNode extends BaseNode {
  @Input()
  @String({
    title: 'Source Text',
    description: 'The text to filter using RegExp',
  })
  sourceText: string = '';

  @Input()
  @String({
    title: 'RegExp',
    description: 'The regular expression pattern to apply',
  })
  pattern: string = '';

  @Output()
  @String({
    title: 'Result Text',
    description: 'Filtered text based on the regular expression',
  })
  result: string = '';

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      if (!this.pattern) {
        throw new Error('RegExp pattern is required.');
      }
      
      const regex = new RegExp(this.pattern, 'g');
      const matches = this.sourceText.match(regex);
      this.result = matches ? matches.join(' ') : '';
    } catch (error:any) {
      console.error('RegExpNode error:', error);
      throw new Error(`RegExpNode execution failed: ${error.message}`);
    }

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    };
  }
}

export default RegExpNode;

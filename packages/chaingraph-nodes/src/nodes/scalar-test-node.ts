/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Boolean,
  Input,
  Node,
  NodeExecutionStatus,
  Number,
  Output,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'

interface Schema {
  properties: {
    hello: {
      type: 'string'
    }
  }
}

@Node({
  title: 'Scalar Node',
  description: 'Node with scalar ports',
})
class ScalarNode extends BaseNode {
  @Input()
  @String({
    defaultValue: 'default string',
  })
  strInput: string = 'default string'

  @Input()
  @Number({
    defaultValue: 42,
  })
  numInput: number = 42

  @Input()
  @Boolean({
    defaultValue: true,
  })
  boolInput: boolean = true

  @Input()
  @PortObject({
    schema: {
      properties: {
        hello: {
          type: 'string',
        },
        world: {
          type: 'string',
        },
        ww3: {
          type: "object",
          schema: {
            properties: {
              w: {
                type: "string"
              }
            }
          }
        }
      },
    },
  })
  profile = { hello: '', world: "", ww3: {w: ""} }


  @Output()
  @PortObject({
    schema: {
      properties: {
        hello: {
          type: 'string',
        },
      },
    },
  })
  outputProfile = { hello: '' }

  @Output()
  @String()
  strOutput: string = 'output string'

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

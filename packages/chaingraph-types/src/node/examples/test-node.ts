import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@chaingraph/types'
import {
  Input,
  Node,
  Output,
  PortArray,
  PortKindEnum,
  PortNumber,
  PortObject,
  PortString,
} from '@chaingraph/types'
import { PortObjectSchema } from '@chaingraph/types/node/decorator/port-object-schema-decorator'
import { BaseNode } from '../base-node'
import 'reflect-metadata'

@PortObjectSchema()
export class TestUserObject {
  @PortString()
  username: string = ''

  @PortString()
  name: string = ''

  @PortNumber()
  age: number = 0

  @PortObject()
  address: TestUserAddress = new TestUserAddress()

  @PortArray({
    elementConfig: {
      kind: PortKindEnum.String,
      defaultValue: '',
    },
  })
  emails: string[] = []
}

@PortObjectSchema()
export class TestUserAddress {
  @PortString()
  street?: string = ''

  @PortString()
  city?: string

  @PortString()
  country?: string = 'RU'
}

@Node({
  type: 'TestNode',
  title: 'Test Node',
  category: 'test',
})
// export class TestNode extends BaseNode {
export class TestNode extends BaseNode {
  @Input() @PortObject()
  user: TestUserObject = new TestUserObject()

  @Input() @PortArray({
    elementConfig: {
      kind: TestUserObject,
      defaultValue: new TestUserObject(),
    },
  })
  friends?: TestUserObject[]

  @Input() @PortArray({
    elementConfig: {
      kind: PortKindEnum.Number,
      defaultValue: 0,
    },
  })
  numbers: number[] = [0, 1, 2, 3]

  @Output() @PortArray({
    elementConfig: {
      kind: PortKindEnum.String,
      defaultValue: '',
    },
  })
  strings: string[] = ['0', '1', '2', '3']

  @Output() @PortArray({
    defaultValue: [[0, 0], [0, 0]],
    elementConfig: {
      // id: 'y',
      // name: 'Y',
      kind: PortKindEnum.Array,
      defaultValue: [0, 0],
      elementConfig: {
        // id: 'x',
        // name: 'X',
        kind: PortKindEnum.Number,
        defaultValue: 0,
      },
    },
  })
  numbers2d: number[][] = [[0, 0], [0, 0]]

  @Output() @PortArray({
    elementConfig: {
      id: 'z',
      name: 'Z',
      kind: PortKindEnum.Array,
      defaultValue: [],
      elementConfig: {
        id: 'y',
        name: 'Y',
        kind: PortKindEnum.Array,
        defaultValue: [],
        elementConfig: {
          id: 'x',
          name: 'X',
          kind: PortKindEnum.Number,
          defaultValue: 0,
        },
      },
    },
  })
  numbers3d: number[][][] = [[[0, 1], [2, 3]], [[4, 5], [6, 7]]]

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: 'completed',
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

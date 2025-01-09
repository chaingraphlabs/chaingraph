import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@chaingraph/types'
import {
  Input,
  Node,
  Output,
  PortArray,
  PortEnum,
  PortKindEnum,
  PortNumber,
  PortObject,
  PortStreamInput,
  PortStreamOutput,
  PortString,
} from '@chaingraph/types'
import { PortObjectSchema } from '@chaingraph/types/node/decorator/port-object-schema-decorator'
import { MultiChannel } from '@chaingraph/types/port/channel/multi-channel'
import { BaseNode } from '../base-node'
import 'reflect-metadata'

@PortObjectSchema({
  description: 'Test user address schema',
})
export class TestUserAddress {
  @PortString({
    description: 'Street of the address',
  })
  street?: string = ''

  @PortString({
    description: 'City of the address',
  })
  city?: string

  @PortString({
    description: 'State of the address',
  })
  country?: string = 'RU'
}

@PortObjectSchema({
  description: 'Test user object schema',
})
export class TestUserObject {
  constructor(data?: Partial<TestUserObject>) {
    if (data) {
      Object.assign(this, data)
    }
  }

  @PortString({
    description: 'Username of the user',
  })
  username: string = ''

  @PortString({
    description: 'Name of the user',
  })
  name: string = ''

  @PortNumber({
    description: 'Age of the user',
  })
  age: number = 0

  @PortObject({
    description: 'Address of the user',
    defaultValue: new TestUserAddress(),
  })
  address: TestUserAddress = new TestUserAddress()

  @PortArray({
    title: 'Emails',
    description: 'Emails of the user',
    elementConfig: {
      kind: PortKindEnum.String,
      defaultValue: '',
    },
  })
  emails: string[] = []
}

@Node({
  type: 'TestNode',
  title: 'Test Node',
  category: 'test',
  description: 'Test node description',
})
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
      kind: PortKindEnum.Array,
      defaultValue: [0, 0],
      elementConfig: {
        kind: PortKindEnum.Number,
        defaultValue: 0,
      },
    },
  })
  numbers2d: number[][] = []

  @Output() @PortArray({
    defaultValue: [[[0, 0], [0, 0]], [[0, 0], [0, 0]]],
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
  numbers3d: number[][][] = []

  @Output() @PortArray({
    defaultValue: [],
    elementConfig: {
      kind: PortKindEnum.Array,
      defaultValue: [],
      elementConfig: {
        kind: TestUserObject,
        defaultValue: new TestUserObject(),
      },
    },
  })
  users2DArray: TestUserObject[][] = []

  @PortEnum({
    defaultValue: 'red',
    options: [
      { kind: PortKindEnum.String, id: 'red', defaultValue: 'Red' },
      { kind: PortKindEnum.String, id: 'green', defaultValue: 'Green' },
      { kind: PortKindEnum.String, id: 'blue', defaultValue: 'Blue' },
    ],
  })
  @Output()
  enumColors = 'red'

  @Output()
  @Output() @PortEnum({
    defaultValue: 'john',
    options: [
      { kind: TestUserObject, id: 'john', defaultValue: new TestUserObject({ username: 'john' }) },
      { kind: TestUserObject, id: 'jane', defaultValue: new TestUserObject({ username: 'jane' }) },
      { kind: TestUserObject, id: 'bob', defaultValue: new TestUserObject({ username: 'bob' }) },
    ],
  })
  enumUsers = 'john'

  @Input() @PortStreamInput({
    defaultValue: new MultiChannel<string>(),
    valueType: {
      kind: PortKindEnum.String,
      defaultValue: '',
    },
  })
  inputStream: MultiChannel<string> = new MultiChannel<string>()

  @Output() @PortStreamOutput({
    defaultValue: new MultiChannel<string>(),
    valueType: {
      kind: PortKindEnum.String,
      defaultValue: '',
    },
  })
  outputStream: MultiChannel<string> = new MultiChannel<string>()

  @Output() @PortStreamOutput({
    defaultValue: new MultiChannel<TestUserObject>(),
    valueType: {
      kind: TestUserObject,
      defaultValue: new TestUserObject(),
    },
  })
  outputStreamUsers: MultiChannel<TestUserObject> = new MultiChannel<TestUserObject>()

  @Output() @PortStreamOutput({
    defaultValue: new MultiChannel<string[]>(),
    valueType: {
      kind: PortKindEnum.Array,
      defaultValue: [],
      elementConfig: {
        kind: PortKindEnum.String,
        defaultValue: '',
      },
    },
  })
  outputStreamBuffered = new MultiChannel<string[]>()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: 'completed',
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

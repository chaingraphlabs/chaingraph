import type { SuperJSONResult } from 'superjson/dist/types'
import {
  BaseNode,
  DefaultValue,
  Description,
  type ExecutionContext,
  Id,
  Input,
  Metadata,
  MultiChannel,
  Name,
  Node,
  type NodeExecutionResult,
  NodeRegistry,
  Optional,
  Output,
  Port,
  PortArray,
  PortArrayNested,
  PortArrayNumber,
  PortArrayObject,
  PortEnum,
  PortEnumFromNative,
  PortEnumFromObject,
  PortKindEnum,
  PortNumber,
  PortNumberEnum,
  PortObject,
  PortObjectSchema,
  PortStreamInput,
  PortStreamOutput,
  PortString,
  PortStringArray,
  PortStringEnum,
  Required,
  Title,
} from '@chaingraph/types'

import { registerPortTransformers } from '@chaingraph/types'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { ExecutionStatus, NodeCategory } from '@chaingraph/types/node/node-enums'
import superjson from 'superjson'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

enum Direction {
  Up = 'Up',
  Down = 'Down',
  Left = 'Left',
  Right = 'Right',
}

@PortObjectSchema()
export class UserStatus {
  @PortString({
    defaultValue: '',
  })
  status: string = ''

  constructor(status: string = '') {
    this.status = status
  }
}

// Define the options mapping
const userStatusOptions = {
  active: new UserStatus('Active'),
  inactive: new UserStatus('Inactive'),
  pending: new UserStatus('Pending'),
}

// Create a mapping from ids to option values
type UserStatusOptionId = keyof typeof userStatusOptions

@PortObjectSchema({
  description: 'Test user address schema',
})
export class TestUserAddress {
  @PortString({
    description: 'Street of the address',
    defaultValue: '',
  })
  street?: string = ''

  @PortString({
    description: 'City of the address',
    defaultValue: '',
  })
  city?: string

  @PortString({
    description: 'State of the address',
    defaultValue: '',
  })
  country?: string = 'EU'
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
    schema: TestUserAddress,
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
  title: 'User Profile',
  category: NodeCategory.Custom,
  description: 'Test node description',
})
export class UserProfileNode extends BaseNode {
  // Case for infer schema from field value
  @Input() @PortObject({
    schema: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user1: TestUserObject = new TestUserObject()

  // Case for infer schema from field type
  @Input() @PortObject({
    defaultValue: new TestUserObject(),
    schema: TestUserObject,
  })
  user2?: TestUserObject

  // Case for infer schema from shema class
  @Input() @PortObject({
    schema: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user3?: TestUserObject

  // Case for infer schema from kind field
  @Input() @Port({
    kind: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user4?: TestUserObject

  // Case for infer schema from decorator default value
  @Input() @PortObject({
    schema: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user5?: TestUserObject

  // Case for infer schema from decorator default value
  @Input() @PortObject({
    schema: TestUserObject,
    defaultValue: new TestUserAddress(),
  })
  address?: TestUserAddress

  @Input() @PortArray({
    defaultValue: [],
    elementConfig: {
      kind: TestUserObject,
      defaultValue: new TestUserObject(),
    },
  })
  friends?: TestUserObject[]

  @Input() @PortArray({
    defaultValue: [],
    elementConfig: {
      kind: PortKindEnum.Number,
      defaultValue: 0,
    },
  })
  numbers: number[] = [0, 1, 2, 3]

  @Output() @PortArray({
    defaultValue: [],
    elementConfig: {
      kind: PortKindEnum.String,
      defaultValue: '',
    },
  })
  strings: string[] = ['0', '1', '2', '3']

  @Output() @PortArray({
    defaultValue: [],
    elementConfig: {
      defaultValue: [],
      kind: PortKindEnum.Array,
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
      key: 'Z',
      kind: PortKindEnum.Array,
      defaultValue: [],
      elementConfig: {
        id: 'y',
        key: 'Y',
        kind: PortKindEnum.Array,
        defaultValue: [],
        elementConfig: {
          id: 'x',
          key: 'X',
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

  @Output()
  @PortStringArray()
  simpleArray?: string[]

  @Output()
  @PortArrayNumber()
  numberArray?: number[]

  @Output()
  @PortArrayObject(TestUserObject, {
    kind: PortKindEnum.Array,
    defaultValue: [],
  })
  simpleObjectArray?: TestUserObject[]

  @Output()
  @PortArrayNested(2, { kind: PortKindEnum.String, defaultValue: '' })
  simple2dArray?: string[][]

  @Output()
  @PortArrayNested(3, { kind: PortKindEnum.Number, defaultValue: 0 })
  numbers3d_2?: number[][][]

  @Output()
  @PortArrayNested(2, {
    kind: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user2DArray?: TestUserObject[][]

  @Output()
  @PortStringEnum(['Red', 'Green', 'Blue'])
  colorEnum: string = 'Red' // This will hold the selected id of the option

  @Output()
  @PortNumberEnum([1, 2, 3])
  numberEnum: string = '1' // Holds the id (string) of the selected option

  @Output()
  @PortEnumFromObject(userStatusOptions)
  statusEnum: UserStatusOptionId = 'active'

  @Output()
  @PortEnumFromNative(Direction)
  directionEnum: Direction = Direction.Up

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.colorEnum = '12'

    return {
      status: ExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

@Node({
  title: 'Advanced Node',
  category: NodeCategory.Custom,
})
export class AdvancedNode extends BaseNode {
  @Input()
  @Required()
  @Name('Username')
  @Description('Enter your username')
  @PortString({
    defaultValue: '',
  })
  username: string = ''

  @Input()
  @Optional()
  @Name('Password')
  @Description('Enter your password')
  @PortString({
    defaultValue: '',
  })
  password?: string

  @Input()
  @DefaultValue(0)
  @PortNumber({
    defaultValue: 0,
  })
  progress: number = 0

  @Output()
  @Id('user_status')
  @Title('User Status')
  @Metadata('ui:widget', 'status-indicator')
  @PortString({
    defaultValue: 'active',
  })
  userStatus: string = 'active'

  execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return Promise.resolve({})
  }
}

describe('complex node', () => {
  beforeAll(() => {
    registerPortTransformers()
    registerNodeTransformers()
  })

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  it('instantiates a user profile node', async () => {
    const testNode = new UserProfileNode('test-node')
    await testNode.initialize()

    // const json = superjson.stringify(testNode)
    const json = superjson.serialize(testNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult)

    expect(parsed).toBeDefined()
    expect(parsed).toEqual(testNode)
  })
})

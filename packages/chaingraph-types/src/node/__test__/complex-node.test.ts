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
import { NodeExecutionStatus } from '@chaingraph/types/node/node-enums'
import { PortType } from '@chaingraph/types/port.new'
import Decimal from 'decimal.js'
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

  toJSON() {
    return {
      status: this.status,
    }
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
  city?: string = ''

  @PortString({
    description: 'State of the address',
    defaultValue: '',
  })
  country?: string = 'EU'

  toJSON() {
    return {
      street: this.street,
      city: this.city,
      country: this.country,
    }
  }
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

  @PortNumber({
    description: 'Age of the user decimal',
  })
  ageDecimal: Decimal = new Decimal(0)

  @PortObject({
    description: 'Address of the user',
    schema: TestUserAddress,
    defaultValue: new TestUserAddress(),
  })
  address: TestUserAddress = new TestUserAddress()

  @PortArray({
    title: 'Emails',
    description: 'Emails of the user',
    itemConfig: {
      type: PortType.String,
      defaultValue: '',
    },
  })
  emails: string[] = []

  toJSON() {
    return {
      username: this.username,
      name: this.name,
      age: this.age,
      ageDecimal: this.ageDecimal,
      address: this.address,
      emails: this.emails,
    }
  }
}

@Node({
  title: 'User Profile',
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

  // Case for infer schema from schema class
  @Input() @PortObject({
    schema: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user3?: TestUserObject

  // Case for infer schema from type field
  @Input() @Port({
    type: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user4?: TestUserObject

  // Case for infer schema from decorator.old default value
  @Input() @PortObject({
    schema: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user5?: TestUserObject

  // Case for infer schema from decorator.old default value
  @Input() @PortObject({
    schema: TestUserObject,
    defaultValue: new TestUserAddress(),
  })
  address?: TestUserAddress

  @Input() @PortArray({
    defaultValue: [],
    itemConfig: {
      type: TestUserObject,
      defaultValue: new TestUserObject(),
    },
  })
  friends?: TestUserObject[]

  @Input() @PortArray({
    defaultValue: [],
    itemConfig: {
      type: PortType.Number,
      defaultValue: 0,
    },
  })
  numbers: number[] = [0, 1, 2, 3]

  @Output() @PortArray({
    defaultValue: [],
    itemConfig: {
      type: PortType.String,
      defaultValue: '',
    },
  })
  strings: string[] = ['0', '1', '2', '3']

  @Output() @PortArray({
    defaultValue: [],
    itemConfig: {
      defaultValue: [],
      type: PortType.Array,
      itemConfig: {
        type: PortType.Number,
        defaultValue: 0,
      },
    },
  })
  numbers2d: number[][] = []

  @Output() @PortArray({
    defaultValue: [[[0, 0], [0, 0]], [[0, 0], [0, 0]]],
    itemConfig: {
      id: 'z',
      key: 'Z',
      type: PortType.Array,
      defaultValue: [],
      itemConfig: {
        id: 'y',
        key: 'Y',
        type: PortType.Array,
        defaultValue: [],
        itemConfig: {
          id: 'x',
          key: 'X',
          type: PortType.Number,
          defaultValue: 0,
        },
      },
    },
  })
  numbers3d: number[][][] = []

  @Output() @PortArray({
    defaultValue: [],
    itemConfig: {
      type: PortType.Array,
      defaultValue: [],
      itemConfig: {
        type: TestUserObject,
        defaultValue: new TestUserObject(),
      },
    },
  })
  users2DArray: TestUserObject[][] = []

  @PortEnum({
    defaultValue: 'red',
    options: [
      { type: PortType.String, id: 'red', defaultValue: 'Red' },
      { type: PortType.String, id: 'green', defaultValue: 'Green' },
      { type: PortType.String, id: 'blue', defaultValue: 'Blue' },
    ],
  })
  @Output()
  enumColors = 'red'

  @Output()
  @PortEnum({
    defaultValue: 'john',
    options: [
      { type: TestUserObject, id: 'john', defaultValue: new TestUserObject({ username: 'john' }) },
      { type: TestUserObject, id: 'jane', defaultValue: new TestUserObject({ username: 'jane' }) },
      { type: TestUserObject, id: 'bob', defaultValue: new TestUserObject({ username: 'bob' }) },
    ],
  })
  enumUsers = 'john'

  @Input() @PortStreamInput({
    defaultValue: new MultiChannel<string>(),
    valueType: {
      type: PortType.String,
      defaultValue: '',
    },
  })
  inputStream: MultiChannel<string> = new MultiChannel<string>()

  @Output() @PortStreamOutput({
    defaultValue: new MultiChannel<string>(),
    valueType: {
      type: PortType.String,
      defaultValue: '',
    },
  })
  outputStream: MultiChannel<string> = new MultiChannel<string>()

  @Output() @PortStreamOutput({
    defaultValue: new MultiChannel<TestUserObject>(),
    valueType: {
      type: TestUserObject,
      defaultValue: new TestUserObject(),
    },
  })
  outputStreamUsers: MultiChannel<TestUserObject> = new MultiChannel<TestUserObject>()

  @Output() @PortStreamOutput({
    defaultValue: new MultiChannel<string[]>(),
    valueType: {
      type: PortType.Array,
      defaultValue: [],
      itemConfig: {
        type: PortType.String,
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
  @PortArrayObject(TestUserObject)
  simpleObjectArray?: TestUserObject[]

  @Output()
  @PortArrayNested(2, { type: PortType.String, defaultValue: '' })
  simple2dArray?: string[][]

  @Output()
  @PortArrayNested(3, { type: PortType.Number, defaultValue: 0 })
  numbers3d_2?: number[][][]

  @Output()
  @PortArrayNested(2, {
    type: TestUserObject,
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
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

@Node({
  title: 'Advanced Node',
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

    const json = superjson.serialize(testNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult) as UserProfileNode

    expect(parsed).toBeDefined()

    // iterate over metadata ports config and compare with the original node
    for (const [key, value] of testNode.metadata.portsConfig!.entries()) {
      const config = parsed.metadata.portsConfig!.get(key)
      expect(config).toBeDefined()
      expect(config).toEqual(value)
    }

    expect(parsed.metadata).toEqual(testNode.metadata)
    expect(parsed.status).toEqual(testNode.status)
  })
})

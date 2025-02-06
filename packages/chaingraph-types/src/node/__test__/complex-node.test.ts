import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import {
  BaseNode,
  DefaultValue,
  Description,
  Id,
  Input,
  Metadata,
  Name,
  Node,
  Number,
  NumberEnum,
  ObjectSchema,
  Output,
  Port,
  PortArray,
  PortArrayNested,
  PortArrayNumber,
  PortArrayObject,
  PortArrayString,
  PortEnum,
  PortEnumFromNative,
  PortEnumFromObject,
  PortObject,
  PortStream,
  String,
  StringEnum,
  Title,
} from '@chaingraph/types'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { NodeExecutionStatus } from '@chaingraph/types/node/node-enums'
import { MultiChannel } from '@chaingraph/types/port/channel'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
  StringPortPlugin,
} from '@chaingraph/types/port/plugins'
import { portRegistry } from '@chaingraph/types/port/registry'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

portRegistry.register(StringPortPlugin)
portRegistry.register(NumberPortPlugin)
portRegistry.register(ArrayPortPlugin)
portRegistry.register(ObjectPortPlugin)
portRegistry.register(EnumPortPlugin)
portRegistry.register(StreamPortPlugin)

enum Direction {
  Up = 'Up',
  Down = 'Down',
  Left = 'Left',
  Right = 'Right',
}

@ObjectSchema()
export class UserStatus {
  @String()
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

@ObjectSchema({
  description: 'Test user address schema',
})
export class TestUserAddress {
  @String({
    description: 'Street of the address',
  })
  street?: string = ''

  @String({
    description: 'City of the address',
  })
  city?: string = ''

  @String({
    description: 'State of the address',
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

@ObjectSchema({
  description: 'Test user object schema',
})
export class TestUserObject {
  constructor(data?: Partial<TestUserObject>) {
    if (data) {
      Object.assign(this, data)
    }
  }

  @String({
    description: 'Username of the user',
  })
  username: string = ''

  @String({
    description: 'Name of the user',
  })
  name: string = ''

  @Number({
    description: 'Age of the user',
  })
  age: number = 0

  @Number({
    description: 'Age of the user decimal',
  })
  ageDecimal: number = 0

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
      type: 'string',
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
  })
  user1: TestUserObject = new TestUserObject()

  // Case for infer schema from field type
  @Input() @PortObject({
    defaultValue: new TestUserObject(),
    schema: TestUserObject,
  })
  user2?: TestUserObject = new TestUserObject()

  // Case for infer schema from type field
  @Input() @Port({
    type: 'object',
    schema: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user4?: TestUserObject = new TestUserObject()

  // Case for infer schema from decorator default value
  @Input() @PortObject({
    schema: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user5?: TestUserObject = new TestUserObject()

  // Case for infer schema from decorator default value
  @Input() @PortObject({
    schema: TestUserAddress,
    defaultValue: new TestUserAddress(),
  })
  address?: TestUserAddress = new TestUserAddress()

  @Input() @PortArray({
    defaultValue: [],
    itemConfig: {
      type: 'object',
      schema: TestUserObject,
      defaultValue: new TestUserObject(),
    },
  })
  friends?: TestUserObject[] = []

  @Input() @PortArray({
    defaultValue: [],
    itemConfig: {
      type: 'number',
      defaultValue: 0,
    },
  })
  numbers: number[] = [0, 1, 2, 3]

  @Output() @PortArray({
    defaultValue: [],
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  strings: string[] = ['0', '1', '2', '3']

  @Output() @PortArray({
    defaultValue: [],
    itemConfig: {
      defaultValue: [],
      type: 'array',
      itemConfig: {
        type: 'number',
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
      type: 'array',
      defaultValue: [],
      itemConfig: {
        id: 'y',
        key: 'Y',
        type: 'array',
        defaultValue: [],
        itemConfig: {
          id: 'x',
          key: 'X',
          type: 'number',
          defaultValue: 0,
        },
      },
    },
  })
  numbers3d: number[][][] = []

  @Output() @PortArray({
    itemConfig: {
      type: 'array',
      defaultValue: [],
      itemConfig: {
        type: 'object',
        schema: TestUserObject,
        defaultValue: new TestUserObject(),
      },
    },
  })
  users2DArray: TestUserObject[][] = []

  @PortEnum({
    defaultValue: 'red',
    options: [
      { type: 'string', id: 'red', defaultValue: 'Red' },
      { type: 'string', id: 'green', defaultValue: 'Green' },
      { type: 'string', id: 'blue', defaultValue: 'Blue' },
    ],
  })
  @Output()
  enumColors = 'red'

  @Output()
  @PortEnum({
    defaultValue: 'john',
    options: [
      {
        type: 'object',
        schema: TestUserObject,
        id: 'john',
        defaultValue: new TestUserObject({ username: 'john' }),
      },
      {
        type: 'object',
        schema: TestUserObject,
        id: 'jane',
        defaultValue: new TestUserObject({ username: 'jane' }),
      },
      {
        type: 'object',
        schema: TestUserObject,
        id: 'bob',
        defaultValue: new TestUserObject({ username: 'bob' }),
      },
    ],
  })
  enumUsers = 'john'

  @Input() @PortStream({
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  inputStream: MultiChannel<string> = new MultiChannel<string>()

  @Output() @PortStream({
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  outputStream: MultiChannel<string> = new MultiChannel<string>()

  @Output() @PortStream({
    itemConfig: {
      type: 'object',
      schema: TestUserObject,
      defaultValue: new TestUserObject(),
    },
  })
  outputStreamUsers: MultiChannel<TestUserObject> = new MultiChannel<TestUserObject>()

  @Output() @PortStream({
    itemConfig: {
      type: 'array',
      defaultValue: [],
      itemConfig: {
        type: 'string',
        defaultValue: '',
      },
    },
  })
  outputStreamBuffered = new MultiChannel<string[]>()

  @Output()
  @PortArrayString()
  simpleArray?: string[]

  @Output()
  @PortArrayNumber()
  numberArray?: number[]

  @Output()
  @PortArrayObject(TestUserObject)
  simpleObjectArray?: TestUserObject[] = []

  @Output()
  @PortArrayNested(2, { type: 'string', defaultValue: '' })
  simple2dArray?: string[][]

  @Output()
  @PortArrayNested(3, { type: 'number', defaultValue: 0 })
  numbers3d_2?: number[][][]

  @Output()
  @PortArrayNested(2, {
    type: 'object',
    schema: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user2DArray?: TestUserObject[][]

  @Output()
  @StringEnum(['Red', 'Green', 'Blue'])
  colorEnum: string = 'Red' // This will hold the selected id of the option

  @Output()
  @NumberEnum([1, 2, 3])
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
  @Name('Username')
  @Description('Enter your username')
  @String({})
  username: string = ''

  @Input()
  @Name('Password')
  @Description('Enter your password')
  @String({
    defaultValue: '',
  })
  password?: string

  @Input()
  @DefaultValue(0)
  @Number({})
  progress: number = 0

  @Output()
  @Id('user_status')
  @Title('User Status')
  @Metadata('ui:widget', 'status-indicator')
  @String({})
  userStatus: string = 'active'

  execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return Promise.resolve({})
  }
}

describe('complex node', () => {
  beforeAll(() => {
    registerNodeTransformers()
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
      expect(config).toStrictEqual(value)
    }

    expect(parsed.metadata).toEqual(testNode.metadata)
    expect(parsed.status).toEqual(testNode.status)
  })
})

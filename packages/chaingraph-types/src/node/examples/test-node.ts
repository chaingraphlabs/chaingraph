import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@chaingraph/types'
import {
  Input,
  Node,
  Output,
  Port,
  PortArray,
  PortEnum,
  PortEnumFromObject,
  PortEnumFromTypeScriptEnum,
  PortKindEnum,
  PortNumber,
  PortNumberEnum,
  PortObject,
  PortStreamInput,
  PortStreamOutput,
  PortString,
  PortStringEnum,
} from '@chaingraph/types'

import {
  PortArrayNested,
  PortArrayNumber,
  PortArrayObject,
  PortStringArray,
} from '@chaingraph/types/node/decorator/port-decorator-array'
import {
  DefaultValue,
  Description,
  Id,
  Metadata,
  Name,
  Optional,
  Required,
  Title,
} from '@chaingraph/types/node/decorator/port-decorator-base'
import { PortObjectSchema } from '@chaingraph/types/node/decorator/port-object-schema-decorator'
import { MultiChannel } from '@chaingraph/types/port/channel/multi-channel'
import { BaseNode } from '../base-node'
import 'reflect-metadata'
import 'core-js'

enum Direction {
  Up = 'Up',
  Down = 'Down',
  Left = 'Left',
  Right = 'Right',
}

@PortObjectSchema()
export class UserStatus {
  @PortString()
  status: string

  constructor(status: string) {
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
  // Case for infer schema from field value
  @Input() @PortObject()
  user1: TestUserObject = new TestUserObject()

  // Case for infer schema from field type
  @Input() @PortObject()
  user2?: TestUserObject

  // Case for infer schema from shema class
  @Input() @PortObject({
    schema: TestUserObject,
  })
  user3?: TestUserObject

  // Case for infer schema from kind field
  @Input() @Port({
    kind: TestUserObject,
  })
  user4?: TestUserObject

  // Case for infer schema from decorator default value
  @Input() @PortObject({
    defaultValue: new TestUserObject(),
  })
  user5?: TestUserObject

  // Case for infer schema from decorator default value
  @Input() @PortObject({
    defaultValue: new TestUserAddress(),
  })
  address?: TestUserAddress

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
    elementConfig: {
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
  @PortArrayNested(2, { kind: PortKindEnum.String, defaultValue: '' })
  simple2dArray?: string[][]

  @Output()
  @PortArrayNested(3, { kind: PortKindEnum.Number, defaultValue: 0 })
  numbers3d_2?: number[][][]

  @Output()
  @PortArrayNested(2, {
    kind: TestUserObject,
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
  @PortEnumFromTypeScriptEnum(Direction)
  directionEnum: Direction = Direction.Up

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: 'completed',
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

@Node({
  type: 'AdvancedNode',
  title: 'Advanced Node',
  category: 'test',
})
export class AdvancedNode {
  @Input()
  @Required()
  @Name('Username')
  @Description('Enter your username')
  @PortString()
  username: string = ''

  @Input()
  @Optional()
  @Name('Password')
  @Description('Enter your password')
  @PortString()
  password?: string

  @Input()
  @DefaultValue(0)
  @PortNumber()
  progress: number = 0

  @Output()
  @Id('user_status')
  @Title('User Status')
  @Metadata('ui:widget', 'status-indicator')
  @PortString()
  status: string = 'active'
}

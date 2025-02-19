/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  BaseNode,
  type ExecutionContext,
  Input,
  MultiChannel,
  Node,
  type NodeExecutionResult,
  NodeExecutionStatus,
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
} from '@badaitech/chaingraph-types'

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
  description: 'Test user address tags schema',
})
class NestedAddressTags {
  @String()
  tag1: string = ''

  @String()
  tag2: string = ''

  toJSON() {
    return {
      tag1: this.tag1,
      tag2: this.tag2,
    }
  }
}

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

  @PortObject({
    description: 'Nested address',
    schema: NestedAddressTags,
  })
  nestedAddress?: NestedAddressTags = new NestedAddressTags()

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
    type: 'object' as const,
    schema: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user4?: TestUserObject = new TestUserObject()

  // Case for infer schema from decorator default value
  @Output() @PortObject({
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

  @Input() @PortArray({
    defaultValue: [],
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  strings: string[] = ['0', '1', '2', '3']

  @Input() @PortArray({
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

  @Input() @PortArray({
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

  @Input() @PortArray({
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
  @Input()
  enumColors = 'red'

  @Input()
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

  @Input() @PortStream({
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  outputStream: MultiChannel<string> = new MultiChannel<string>()

  @Input() @PortStream({
    itemConfig: {
      type: 'object',
      schema: TestUserObject,
      defaultValue: new TestUserObject(),
    },
  })
  outputStreamUsers: MultiChannel<TestUserObject> = new MultiChannel<TestUserObject>()

  @Input() @PortStream({
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

  @Input()
  @PortArrayString()
  simpleArray?: string[]

  @Input()
  @PortArrayNumber()
  numberArray?: number[]

  @Input()
  @PortArrayObject(TestUserObject)
  simpleObjectArray?: TestUserObject[] = []

  @Input()
  @PortArrayNested(2, { type: 'string', defaultValue: '' })
  simple2dArray?: string[][]

  @Input()
  @PortArrayNested(3, { type: 'number', defaultValue: 0 })
  numbers3d_2?: number[][][]

  @Input()
  @PortArrayNested(2, {
    type: 'object',
    schema: TestUserObject,
    defaultValue: new TestUserObject(),
  })
  user2DArray?: TestUserObject[][]

  @Input()
  @StringEnum(['Red', 'Green', 'Blue'])
  colorEnum: string = 'Red' // This will hold the selected id of the option

  @Input()
  @NumberEnum([1, 2, 3])
  numberEnum: string = '1' // Holds the id (string) of the selected option

  @Input()
  @PortEnumFromObject(userStatusOptions)
  statusEnum: UserStatusOptionId = 'active'

  @Input()
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

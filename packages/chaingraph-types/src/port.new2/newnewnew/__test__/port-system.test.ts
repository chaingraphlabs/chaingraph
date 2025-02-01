import type {
  IArrayPortConfig,
  IBooleanPortConfig,
  INumberPortConfig,
  IObjectPortConfig,
  IPortConfigUnion,
  IStringPortConfig,
} from '../port-configs'

import type {
  ArrayPort,
  BooleanPort,
  EnumPort,
  NumberPort,
  ObjectPort,
  StringPort,
} from '../port-full'
import { getValue } from '@chaingraph/types/port.new2/newnewnew/port-unwrapper'
import { describe, expect, it } from 'vitest'
// Import our exported port types:
import { PortTypeEnum } from '../port-types.enum'

// ────── Scalar Ports ───────────────────────────────────────────

describe('scalar Port Types', () => {
  it('should create a valid StringPort', () => {
    const sp: StringPort = {
      config: {
        id: 'str1',
        type: PortTypeEnum.String,
        name: 'My String Port',
      },
      value: {
        type: PortTypeEnum.String,
        value: 'Hello, world!',
      },
    }
    expect(sp.value.value).toBe('Hello, world!')
  })

  it('should create a valid NumberPort', () => {
    const np: NumberPort = {
      config: {
        id: 'num1',
        type: PortTypeEnum.Number,
      },
      value: {
        type: PortTypeEnum.Number,
        value: 123,
      },
    }
    expect(np.value.value).toBe(123)
  })

  it('should create a valid BooleanPort', () => {
    const bp: BooleanPort = {
      config: {
        id: 'bool1',
        type: PortTypeEnum.Boolean,
      },
      value: {
        type: PortTypeEnum.Boolean,
        value: true,
      },
    }
    expect(bp.value.value).toBe(true)
  })
})

// ────── Enum Port ──────────────────────────────────────────────

describe('enum Port Type', () => {
  it('should create a valid EnumPort with options', () => {
    const ep: EnumPort = {
      config: {
        id: 'enum1',
        type: PortTypeEnum.Enum,
        options: [
          { id: 'opt1', type: PortTypeEnum.String },
          { id: 'opt2', type: PortTypeEnum.Number },
        ],
      },
      value: {
        type: PortTypeEnum.Enum,
        value: 'opt1',
      },
    }
    expect(ep.value.value).toBe('opt1')
  })
})

// ────── Generic Array Port ─────────────────────────────────────

describe('generic Array Port', () => {
  it('should create a valid ArrayPort of strings', () => {
    // Here the generic parameter is IStringPortConfig so that each element is inferred as IStringPortValue.
    const asp: ArrayPort<IStringPortConfig> = {
      config: {
        id: 'arr1',
        type: PortTypeEnum.Array,
        itemConfig: {
          id: 'strItem',
          type: PortTypeEnum.String,
        },
      },
      value: {
        type: PortTypeEnum.Array,
        value: [
          { type: PortTypeEnum.String, value: 'A' },
          { type: PortTypeEnum.String, value: 'B' },
        ],
      },
    }

    expect(Array.isArray(asp.value.value)).toBe(true)
    expect(asp.value.value[0].value).toBe('A')
  })

  it('should create a valid 2D ArrayPort of booleans', () => {
    // A 2D array: the outer array’s item is itself an array of booleans.
    type BooleanArrayConfig = IArrayPortConfig<IBooleanPortConfig>
    const arr2d: ArrayPort<BooleanArrayConfig> = {
      config: {
        id: 'arr2d',
        type: PortTypeEnum.Array,
        itemConfig: {
          id: 'innerArray',
          type: PortTypeEnum.Array,
          itemConfig: {
            id: 'boolItem',
            type: PortTypeEnum.Boolean,
          },
        },
      },
      value: {
        type: PortTypeEnum.Array,
        value: [
          {
            type: PortTypeEnum.Array,
            value: [
              { type: PortTypeEnum.Boolean, value: true },
              { type: PortTypeEnum.Boolean, value: false },
            ],
          },
          {
            type: PortTypeEnum.Array,
            value: [
              { type: PortTypeEnum.Boolean, value: false },
              { type: PortTypeEnum.Boolean, value: true },
            ],
          },
        ],
      },
    }

    expect(Array.isArray(arr2d.value.value)).toBe(true)
    // Check first inner array first element:
    expect(arr2d.value.value[0].value[0].value).toBe(true)
  })

  it('should create a valid 3D ArrayPort of numbers', () => {
    // For a 3D array: each element is an array whose item is an array of numbers.
    type Number2DArrayConfig = IArrayPortConfig<INumberPortConfig>
    type Number3DArrayConfig = IArrayPortConfig<Number2DArrayConfig>
    const arr3d: ArrayPort<Number3DArrayConfig> = {
      config: {
        id: 'arr3d',
        type: PortTypeEnum.Array,
        itemConfig: {
          id: '2DArray',
          type: PortTypeEnum.Array,
          itemConfig: {
            id: 'numItem',
            type: PortTypeEnum.Array,
            itemConfig: {
              id: 'numItem2',
              type: PortTypeEnum.Number,
            },
          },
        },
      },
      value: {
        type: PortTypeEnum.Array,
        value: [
          {
            type: PortTypeEnum.Array,
            value: [
              {
                type: PortTypeEnum.Array,
                value: [
                  { type: PortTypeEnum.Number, value: 1 },
                  { type: PortTypeEnum.Number, value: 2 },
                ],
              },
            ],
          },
          {
            type: PortTypeEnum.Array,
            value: [
              {
                type: PortTypeEnum.Array,
                value: [
                  { type: PortTypeEnum.Number, value: 3 },
                  { type: PortTypeEnum.Number, value: 4 },
                ],
              },
            ],
          },
        ],
      },
    }

    // Verify nested structure:
    expect(arr3d.value.value[0].value[0].value[0].value).toBe(1)
  })
})

// ────── Generic Object Port ─────────────────────────────────────

describe('generic Object Port', () => {
  it('should create a valid ObjectPort with a defined schema', () => {
    // Define a schema with two fields: field1 (string) and field2 (number).
    interface MySchema2 extends Record<string, IPortConfigUnion> {
      color: IStringPortConfig
    }

    interface MySchema extends Record<string, IPortConfigUnion> {
      field1: IStringPortConfig
      field2: INumberPortConfig
      field3: IObjectPortConfig<MySchema2>
    }

    const op: ObjectPort<MySchema> = {
      config: {
        type: PortTypeEnum.Object,
        schema: {
          field1: { type: PortTypeEnum.String },
          field2: { type: PortTypeEnum.Number },
          field3: {
            type: PortTypeEnum.Object,
            schema: {
              color: { type: PortTypeEnum.String },
            },
          },
        },
      },
      value: {
        type: PortTypeEnum.Object,
        value: {
          field1: { type: PortTypeEnum.String, value: 'TestValue' },
          field2: { type: PortTypeEnum.Number, value: 789 },
          field3: {
            type: PortTypeEnum.Object,
            value: {
              color: { type: PortTypeEnum.String, value: 'red' },
            },
          },
        },
      },
    }

    expect(op.value.value.field1.value).toBe('TestValue')
    expect(op.value.value.field2.value).toBe(789)
    expect(op.value.value.field3.value.color.value).toBe('red')

    const unwrapped = getValue(op)
    expect(unwrapped.field3.color).toBe('red')

    unwrapped.field3.color = 'blue'
    expect(op.value.value.field3.value.color.value).toBe('blue')
  })
})

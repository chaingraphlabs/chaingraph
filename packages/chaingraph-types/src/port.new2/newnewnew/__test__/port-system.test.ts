import type {
  IArrayPortConfig,
  IBooleanPortConfig,
  INumberPortConfig,
  IObjectPortConfig,
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
import type { PortConfig } from '../zod-port-configs'
import { describe, expect, it } from 'vitest'
import { PortTypeEnum } from '../port-types.enum'
import { unwrapMutableValue, unwrapValue } from '../port-unwrapper'
import { FullPortSchema } from '../zod-full-port'

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

    // Validate using Zod schema
    expect(() => FullPortSchema.parse(sp)).not.toThrow()
    expect(sp.value.value).toBe('Hello, world!')

    const unwrapped = unwrapValue(sp)
    expect(unwrapped).toBe('Hello, world!')
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

    // Validate using Zod schema
    expect(() => FullPortSchema.parse(np)).not.toThrow()
    expect(np.value.value).toBe(123)

    const unwrapped = unwrapValue(np)
    expect(unwrapped).toBe(123)
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

    // Validate using Zod schema
    expect(() => FullPortSchema.parse(bp)).not.toThrow()
    expect(bp.value.value).toBe(true)

    const unwrapped = unwrapValue(bp)
    expect(unwrapped).toBe(true)
  })

  it('should reject invalid port structures', () => {
    const invalidPort = {
      config: {
        id: 'invalid1',
        type: 'invalid_type' as PortTypeEnum,
      },
      value: {
        type: PortTypeEnum.String,
        value: 42, // Wrong value type for string port
      },
    }

    expect(() => FullPortSchema.parse(invalidPort)).toThrow()
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

    // Validate using Zod schema
    expect(() => FullPortSchema.parse(ep)).not.toThrow()
    expect(ep.value.value).toBe('opt1')

    const unwrapped = unwrapValue(ep)
    expect(unwrapped).toBe('opt1')
  })
})

// ────── Generic Array Port ─────────────────────────────────────

describe('generic Array Port', () => {
  it('should create a valid ArrayPort of strings', () => {
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

    // Validate using Zod schema
    expect(() => FullPortSchema.parse(asp)).not.toThrow()
    expect(Array.isArray(asp.value.value)).toBe(true)
    expect(asp.value.value[0].value).toBe('A')

    const unwrapped = unwrapValue(asp)
    const mutable = unwrapMutableValue(asp)

    // Test immutable operations
    expect(unwrapped[0]).toBe('A')
    unwrapped[0] = 'C'
    expect(asp.value.value[0].value).toBe('A')

    // Test mutable operations
    mutable[0] = 'C'
    expect(asp.value.value[0].value).toBe('C')

    mutable[1] = 'D'
    expect(asp.value.value[1].value).toBe('D')

    mutable.push('E')
    expect(asp.value.value[2].value).toBe('E')

    mutable.unshift('B')
    expect(asp.value.value[0].value).toBe('B')

    const mapped = mutable.map((el, i) => el + i.toString())
    expect(mapped[0]).toBe('B0')
    expect(mapped[1]).toBe('C1')
    expect(mapped[2]).toBe('D2')
    expect(mapped[3]).toBe('E3')

    // pop
    const popped = mutable.pop()
    expect(popped).toBe('E')
    expect(asp.value.value.length).toBe(3)
    // shift
    const shifted = mutable.shift()
    expect(shifted).toBe('B')
    expect(asp.value.value.length).toBe(2)
    // push x3
    mutable.push('E')
    mutable.push('F')
    mutable.push('G')
    expect(asp.value.value.length).toBe(5)
  })

  it('should create a valid 2D ArrayPort of booleans', () => {
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

    // Validate using Zod schema
    expect(() => FullPortSchema.parse(arr2d)).not.toThrow()
    expect(Array.isArray(arr2d.value.value)).toBe(true)
    expect(arr2d.value.value[0].value[0].value).toBe(true)

    const unwrapped = unwrapValue(arr2d)
    const mutable = unwrapMutableValue(arr2d)

    // Test immutable operations
    expect(unwrapped[0][0]).toBe(true)
    unwrapped[0][0] = false
    expect(arr2d.value.value[0].value[0].value).toBe(true)

    // Test mutable operations
    mutable[0][0] = false
    expect(arr2d.value.value[0].value[0].value).toBe(false)
  })

  it('should create a valid 3D ArrayPort of numbers', () => {
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

    // Validate using Zod schema
    expect(() => FullPortSchema.parse(arr3d)).not.toThrow()
    expect(arr3d.value.value[0].value[0].value[0].value).toBe(1)

    const unwrapped = unwrapValue(arr3d)
    const mutable = unwrapMutableValue(arr3d)

    // Test immutable operations
    expect(unwrapped[0][0][0]).toBe(1)
    unwrapped[0][0][0] = 5
    expect(arr3d.value.value[0].value[0].value[0].value).toBe(1)

    // Test mutable operations
    mutable[0][0][0] = 5
    expect(arr3d.value.value[0].value[0].value[0].value).toBe(5)
  })
})

// ────── Generic Object Port ─────────────────────────────────────

describe('generic Object Port', () => {
  it('should create a valid ObjectPort with a defined schema', () => {
    interface ColorSchema extends Record<string, PortConfig> {
      color: IStringPortConfig
    }

    interface ColorSchemaTwo extends Record<string, PortConfig> {
      schema: IObjectPortConfig<ColorSchema>
      other: IStringPortConfig
    }

    interface ColorSchemaThree extends Record<string, PortConfig> {
      internal: IObjectPortConfig<ColorSchemaTwo>
      root: IStringPortConfig
      parent: IObjectPortConfig<ColorSchema>
    }

    interface MySchema extends Record<string, PortConfig> {
      field1: IStringPortConfig
      field2: INumberPortConfig
      field3: IObjectPortConfig<ColorSchema>
      field4: IObjectPortConfig<ColorSchemaTwo>
      field5: IObjectPortConfig<ColorSchemaThree>
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
          field4: {
            type: PortTypeEnum.Object,
            schema: {
              schema: {
                type: PortTypeEnum.Object,
                schema: {
                  color: { type: PortTypeEnum.String },
                },
              },
              other: { type: PortTypeEnum.String },
            },
          },
          field5: {
            type: PortTypeEnum.Object,
            schema: {
              internal: {
                type: PortTypeEnum.Object,
                schema: {
                  schema: {
                    type: PortTypeEnum.Object,
                    schema: {
                      color: { type: PortTypeEnum.String },
                    },
                  },
                  other: { type: PortTypeEnum.String },
                },
              },
              root: { type: PortTypeEnum.String },
              parent: {
                type: PortTypeEnum.Object,
                schema: {
                  color: { type: PortTypeEnum.String },
                },
              },
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
          field4: {
            type: PortTypeEnum.Object,
            value: {
              schema: {
                type: PortTypeEnum.Object,
                value: {
                  color: { type: PortTypeEnum.String, value: 'red' },
                },
              },
              other: { type: PortTypeEnum.String, value: 'Test' },
            },
          },
          field5: {
            type: PortTypeEnum.Object,
            value: {
              internal: {
                type: PortTypeEnum.Object,
                value: {
                  schema: {
                    type: PortTypeEnum.Object,
                    value: {
                      color: { type: PortTypeEnum.String, value: 'red' },
                    },
                  },
                  other: { type: PortTypeEnum.String, value: 'Test' },
                },
              },
              root: { type: PortTypeEnum.String, value: 'Root' },
              parent: {
                type: PortTypeEnum.Object,
                value: {
                  color: { type: PortTypeEnum.String, value: 'red' },
                },
              },
            },
          },
        },
      },
    }

    // Validate using Zod schema
    expect(() => FullPortSchema.parse(op)).not.toThrow()
    expect(op.value.value.field1.value).toBe('TestValue')
    expect(op.value.value.field2.value).toBe(789)
    expect(op.value.value.field3.value.color.value).toBe('red')

    const unwrapped = unwrapValue(op)
    const mutable = unwrapMutableValue(op)

    // Test immutable operations
    expect(unwrapped.field3.color).toBe('red')
    unwrapped.field3.color = 'blue'
    expect(op.value.value.field3.value.color.value).toBe('red')

    // Test mutable operations
    mutable.field3.color = 'blue'
    expect(op.value.value.field3.value.color.value).toBe('blue')

    mutable.field3 = { color: 'green' }
    expect(op.value.value.field3.value.color.value).toBe('green')

    mutable.field4.schema.color = 'blue'
    expect(op.value.value.field4.value.schema.value.color.value).toBe('blue')

    mutable.field4.other = 'Other'
    expect(op.value.value.field4.value.other.value).toBe('Other')

    mutable.field4 = { schema: { color: 'green' }, other: 'Another' }
    expect(op.value.value.field4.value.schema.value.color.value).toBe('green')
    expect(op.value.value.field4.value.other.value).toBe('Another')

    mutable.field5.internal.other = 'Another'
    expect(op.value.value.field5.value.internal.value.other.value).toBe('Another')

    mutable.field5.internal = { schema: { color: 'green' }, other: 'Another' }
    expect(op.value.value.field5.value.internal.value.schema.value.color.value).toBe('green')
    expect(op.value.value.field5.value.internal.value.other.value).toBe('Another')

    mutable.field5.parent.color = 'blue'
    expect(op.value.value.field5.value.parent.value.color.value).toBe('blue')

    mutable.field5.root = 'Root2'
    expect(op.value.value.field5.value.root.value).toBe('Root2')

    mutable.field5 = {
      internal: { schema: { color: 'green' }, other: 'Another' },
      root: 'Root3',
      parent: { color: 'blue' },
    }

    expect(op.value.value.field5.value.internal.value.schema.value.color.value).toBe('green')
    expect(op.value.value.field5.value.internal.value.other.value).toBe('Another')
    expect(op.value.value.field5.value.root.value).toBe('Root3')
    expect(op.value.value.field5.value.parent.value.color.value).toBe('blue')
  })
})

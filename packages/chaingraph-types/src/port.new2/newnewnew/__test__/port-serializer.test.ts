import type { IStringPortConfig } from '../port-configs'
import type { ArrayPort, NumberPort, StringPort } from '../port-full'
import { describe, expect, it } from 'vitest'
import { NumberPortSchema, StringPortSchema } from '../custom-schemas'
import { deserializePort, deserializePortAs, serializePort } from '../port-serializer'
import { PortTypeEnum } from '../port-types.enum'
import { FullPortSchema } from '../zod-full-port'

describe('port Serialization', () => {
  it('should serialize and deserialize a valid StringPort correctly', () => {
    const port: StringPort = {
      config: {
        id: 'str1',
        type: PortTypeEnum.String,
        name: 'Serialized Port',
      },
      value: {
        type: PortTypeEnum.String,
        value: 'Hello, JSON!',
      },
    }

    // Serialize the port to a JSON string
    const json = serializePort(port)

    // Deserialize the JSON string back to a port object
    const deserializedPort = deserializePort(json)

    // Validate that the deserialized port exactly matches the original structure
    expect(FullPortSchema.parse(deserializedPort)).toEqual(FullPortSchema.parse(port))
  })

  it('should serialize and deserialize a NumberPort correctly', () => {
    const port: NumberPort = {
      config: {
        id: 'num1',
        type: PortTypeEnum.Number,
      },
      value: {
        type: PortTypeEnum.Number,
        value: 42.5,
      },
    }

    const json = serializePort(port)
    const deserializedPort = deserializePort(json)
    expect(FullPortSchema.parse(deserializedPort)).toEqual(FullPortSchema.parse(port))
  })

  it('should serialize and deserialize an ArrayPort correctly', () => {
    const port: ArrayPort<IStringPortConfig> = {
      config: {
        id: 'arr1',
        type: PortTypeEnum.Array,
        itemConfig: {
          type: PortTypeEnum.String,
        },
      },
      value: {
        type: PortTypeEnum.Array,
        value: [
          { type: PortTypeEnum.String, value: 'first' },
          { type: PortTypeEnum.String, value: 'second' },
        ],
      },
    }

    const json = serializePort(port)
    const deserializedPort = deserializePort(json)
    expect(FullPortSchema.parse(deserializedPort)).toEqual(FullPortSchema.parse(port))
  })

  it('should throw an error when deserializing an invalid JSON string', () => {
    const invalidJson = '{"config": {"id": "x", "type": "invalid"}, "value": {"type": "string", "value": 42}}'
    expect(() => deserializePort(invalidJson)).toThrow()
  })

  it('should throw an error when deserializing malformed JSON', () => {
    const malformedJson = '{"config": {'
    expect(() => deserializePort(malformedJson)).toThrow()
  })

  it('should throw an error when serializing an invalid port object', () => {
    const invalidPort = {
      config: {
        id: 'invalid1',
        type: 'invalid_type',
      },
      value: {
        type: PortTypeEnum.String,
        value: 42, // Wrong value type for string port
      },
    }

    expect(() => serializePort(invalidPort as any)).toThrow()
  })

  describe('type-safe Deserialization', () => {
    it('should deserialize as StringPort with correct type inference', () => {
      const port: StringPort = {
        config: {
          id: 'str1',
          type: PortTypeEnum.String,
          name: 'Type-safe Port',
        },
        value: {
          type: PortTypeEnum.String,
          value: 'Hello, Types!',
        },
      }

      const json = serializePort(port)
      const typedPort = deserializePortAs<StringPort>(json, StringPortSchema)

      // TypeScript should know this is a string
      expect(typeof typedPort.value.value).toBe('string')
      expect(typedPort.value.value.toUpperCase()).toBe('HELLO, TYPES!')
    })

    it('should deserialize as NumberPort with correct type inference', () => {
      const port: NumberPort = {
        config: {
          id: 'num1',
          type: PortTypeEnum.Number,
        },
        value: {
          type: PortTypeEnum.Number,
          value: 42.5,
        },
      }

      const json = serializePort(port)
      const typedPort = deserializePortAs<NumberPort>(json, NumberPortSchema)

      // TypeScript should know this is a number
      expect(typeof typedPort.value.value).toBe('number')
      expect(typedPort.value.value + 10).toBe(52.5)
    })

    it('should throw when deserializing with wrong schema', () => {
      const numberPort: NumberPort = {
        config: {
          id: 'num1',
          type: PortTypeEnum.Number,
        },
        value: {
          type: PortTypeEnum.Number,
          value: 42,
        },
      }

      const json = serializePort(numberPort)
      // Trying to deserialize a number port as string should fail
      expect(() => deserializePortAs<StringPort>(json, StringPortSchema)).toThrow()
    })
  })
})

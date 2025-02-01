import type { IStringPortConfig } from '../port-configs'
import type { ArrayPort, NumberPort, StringPort } from '../port-full'
import { describe, expect, it } from 'vitest'
import { deserializePort, serializePort } from '../port-serializer'
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

  it('should preserve metadata in serialization', () => {
    const port: StringPort = {
      config: {
        id: 'str1',
        type: PortTypeEnum.String,
        name: 'Port with Metadata',
        metadata: {
          description: 'Test port',
          tags: ['test', 'serialization'],
          version: 1,
        },
      },
      value: {
        type: PortTypeEnum.String,
        value: 'Hello with metadata!',
      },
    }

    const json = serializePort(port)
    const deserializedPort = deserializePort(json)

    expect(deserializedPort.config.metadata).toEqual(port.config.metadata)
  })
})

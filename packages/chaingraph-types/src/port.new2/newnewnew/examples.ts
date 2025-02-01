import type { ArrayPort, NumberPort, StringPort } from './port-full'
import { NumberPortSchema, StringPortSchema } from './custom-schemas'
import { deserializePort, deserializePortAs, serializePort } from './port-serializer'
import { PortTypeEnum } from './port-types.enum'
import { unwrapMutableValue } from './port-unwrapper'

/**
 * Example 1: Basic port serialization and deserialization
 */
function basicSerializationExample() {
  const stringPort: StringPort = {
    config: {
      id: 'str1',
      type: PortTypeEnum.String,
      name: 'Example String Port',
    },
    value: {
      type: PortTypeEnum.String,
      value: 'Hello, World!',
    },
  }

  // Serialize to JSON
  const json = serializePort(stringPort)
  console.log('Serialized port:', json)

  // Basic deserialization (returns InferredFullPort)
  const basicDeserialized = deserializePort(json)
  console.log('Basic deserialized port:', basicDeserialized)

  // Type-safe deserialization as StringPort
  const typedStringPort = deserializePortAs<StringPort>(json, StringPortSchema)
  // TypeScript now knows this is a string
  console.log('String value:', typedStringPort.value.value.toUpperCase())
}

/**
 * Example 2: Type-safe array port deserialization
 */
function arrayPortExample() {
  const arrayPort: ArrayPort<StringPort['config']> = {
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

  const json = serializePort(arrayPort)

  // Get mutable proxy with validation
  const mutable = unwrapMutableValue(arrayPort)
  mutable.push('third') // Automatically wraps in correct structure

  // Deserialize with type safety
  const deserializedArray = deserializePort(json)
  console.log('Updated array:', deserializedArray.value.value)
}

/**
 * Example 3: Type-safe number port handling
 */
function numberPortExample() {
  const numberPort: NumberPort = {
    config: {
      id: 'num1',
      type: PortTypeEnum.Number,
    },
    value: {
      type: PortTypeEnum.Number,
      value: 42.5,
    },
  }

  const json = serializePort(numberPort)

  // Type-safe deserialization as NumberPort
  const typedNumberPort = deserializePortAs<NumberPort>(json, NumberPortSchema)
  // TypeScript knows this is a number
  console.log('Number value plus 10:', typedNumberPort.value.value + 10)
}

/**
 * Example 4: Error handling with invalid data
 */
function errorHandlingExample() {
  const invalidJson = '{"config": {"id": "x", "type": "invalid"}, "value": {"type": "string", "value": 42}}'

  try {
    // This will throw due to invalid type
    deserializePort(invalidJson)
  } catch (error) {
    console.error('Validation error:', error)
  }

  try {
    // This will throw due to schema mismatch
    deserializePortAs<StringPort>(invalidJson, StringPortSchema)
  } catch (error) {
    console.error('Type-safe deserialization error:', error)
  }
}

// Run examples
basicSerializationExample()
arrayPortExample()
numberPortExample()
errorHandlingExample()

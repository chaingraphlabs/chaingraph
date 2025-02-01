import type { StringPort } from '../port-full'
import { StringPortSchema } from '../custom-schemas'
import {
  deserializePortAs,
  deserializePortFromString,
  serializePortToJSONValue,
  serializePortToString,
} from '../port-serializer'
import { PortTypeEnum } from '../port-types.enum'

/**
 * Example demonstrating the full serialization cycle:
 * 1. Port -> JSONValue -> String
 * 2. String -> JSONValue -> Port
 */
function demonstrateSerializationCycle() {
  // Create a sample string port
  const stringPort: StringPort = {
    config: {
      id: 'example',
      type: PortTypeEnum.String,
      name: 'Example String Port',
    },
    value: {
      type: PortTypeEnum.String,
      value: 'Hello, World!',
    },
  }

  // Step 1: Convert to JSONValue (first layer)
  const jsonValue = serializePortToJSONValue(stringPort)
  console.log('As JSONValue:', jsonValue)

  // Step 2: Convert to string (second layer)
  const jsonString = serializePortToString(stringPort)
  console.log('As JSON string:', jsonString)

  // Step 3: Parse back to port (generic)
  const restoredPort = deserializePortFromString(jsonString)
  console.log('Restored port (generic):', restoredPort)

  // Step 4: Parse back with type safety
  const typedPort = deserializePortAs<StringPort>(jsonString, StringPortSchema)
  console.log('Restored port (typed):', typedPort)

  // Verify the cycle maintained data integrity
  console.assert(
    typedPort.config.id === stringPort.config.id,
    'Config ID preserved',
  )
  console.assert(
    typedPort.value.value === stringPort.value.value,
    'String value preserved',
  )
}

/**
 * Example demonstrating error handling with invalid data
 */
function demonstrateErrorHandling() {
  // Try to deserialize invalid JSON
  try {
    deserializePortFromString('{"invalid": "json"}')
  } catch (error) {
    console.error('Invalid JSON error:', error)
  }

  // Try to deserialize valid JSON but invalid port structure
  try {
    deserializePortFromString('{"type": "string", "value": 42}')
  } catch (error) {
    console.error('Invalid port structure error:', error)
  }

  // Try to deserialize with wrong schema
  try {
    const numberJson = '{"config":{"type":"number"},"value":{"type":"number","value":42}}'
    deserializePortAs(numberJson, StringPortSchema)
  } catch (error) {
    console.error('Schema mismatch error:', error)
  }
}

// Run examples
demonstrateSerializationCycle()
demonstrateErrorHandling()

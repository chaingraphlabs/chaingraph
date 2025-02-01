import type { ArrayPort, NumberPort, ObjectPort, StringPort } from './port-full'
import type { PortConfig } from './zod-port-configs'
import { PortTypeEnum } from './port-types.enum'
import { unwrapMutableValue, unwrapValue } from './port-unwrapper'
import { FullPortSchema } from './zod-full-port'

/**
 * Example 1: Creating and validating a simple string port
 */
function stringPortExample() {
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

  // Validate using Zod schema
  const validated = FullPortSchema.parse(stringPort)
  console.log('Validated string port:', validated)

  // Unwrap with runtime validation
  const unwrapped = unwrapValue(stringPort)
  console.log('Unwrapped value:', unwrapped) // "Hello, World!"
}

/**
 * Example 2: Array port with validation
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

  // Validate using Zod schema
  const validated = FullPortSchema.parse(arrayPort)
  console.log('Validated array port:', validated)

  // Get mutable proxy with validation
  const mutable = unwrapMutableValue(arrayPort)
  mutable.push('third') // Automatically wraps in correct structure
  console.log('Updated array:', arrayPort.value.value)
}

/**
 * Example 3: Object port with nested structure
 */
function objectPortExample() {
  interface PersonSchema extends Record<string, PortConfig> {
    name: StringPort['config']
    age: NumberPort['config']
  }

  const personPort: ObjectPort<PersonSchema> = {
    config: {
      id: 'person1',
      type: PortTypeEnum.Object,
      schema: {
        name: { type: PortTypeEnum.String },
        age: { type: PortTypeEnum.Number },
      },
    },
    value: {
      type: PortTypeEnum.Object,
      value: {
        name: { type: PortTypeEnum.String, value: 'John' },
        age: { type: PortTypeEnum.Number, value: 30 },
      },
    },
  }

  // Validate using Zod schema
  const validated = FullPortSchema.parse(personPort)
  console.log('Validated object port:', validated)

  // Get mutable proxy with validation
  const mutable = unwrapMutableValue(personPort)
  mutable.name = 'Jane' // Automatically maintains wrapper structure
  console.log('Updated person:', personPort.value.value)
}

/**
 * Example 4: Handling validation errors
 */
function validationErrorExample() {
  const invalidPort = {
    config: {
      id: 'invalid1',
      type: 'invalid_type', // Invalid type
    },
    value: {
      type: PortTypeEnum.String,
      value: 42, // Wrong value type for string port
    },
  }

  try {
    FullPortSchema.parse(invalidPort)
  } catch (error) {
    console.error('Validation error:', error)
  }
}

// Run examples
stringPortExample()
arrayPortExample()
objectPortExample()
validationErrorExample()

import { createObjectPortConfig, createObjectSchema, ObjectPort } from './ObjectPort'

// Create a schema for a user object
const userSchema = createObjectSchema({
  name: { type: 'string', minLength: 2 },
  age: { type: 'number', min: 21 },
})

// Create a configuration using the inferred schema
const userConfig = createObjectPortConfig({
  type: 'object',
  schema: userSchema,
  defaultValue: {
    type: 'object',
    value: {
      name: { type: 'string', value: 'Alice' },
      age: { type: 'number', value: 30 },
    },
  },
})

// Creating the Object Port (the type parameter S is inferred from userConfig.schema)
const userPort = new ObjectPort(userConfig)

// Access the default value with full typing/autocompletion
const userValue = userPort.getValue()
console.log(userValue?.value.name.value) // Expected output: 'Alice'
console.log(userValue?.value.age.value) // Expected output: 30

/* Example 2: Minimal Configuration without Explicit Generic Annotation */

// Construct the config inline; the generic parameter is inferred from the literal.
const config2 = createObjectPortConfig({
  type: 'object',
  schema: {
    properties: {
      title: { type: 'string', minLength: 5 },
      count: { type: 'number', min: 1 },
    },
  },
  defaultValue: {
    type: 'object',
    value: {
      title: { type: 'string', value: 'Hello World' },
      count: { type: 'number', value: 10 },
    },
  },
})

const port2 = new ObjectPort(config2)
console.log(port2.getValue()?.value.title.value) // Expected output: 'Hello World'
console.log(port2.getValue()?.value.count.value) // Expected output: 10

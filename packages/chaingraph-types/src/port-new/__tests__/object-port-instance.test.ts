import type {
  ArrayPortConfig,
  NumberPortConfig,
  NumberPortValue,
  StringPortConfig,
  StringPortValue,
} from '../base/types'
import {
  mutableUnwrapPortValueWithConfig,
} from '@chaingraph/types/port-new/base/unwrap-value-mutable'
import { beforeEach, describe, expect, it } from 'vitest'
import { createObjectPortConfig, createObjectSchema, ObjectPort } from '../instances/ObjectPort'
import { ArrayPortPlugin, createObjectValue, NumberPortPlugin, ObjectPortPlugin, StringPortPlugin } from '../plugins'
import { portRegistry } from '../registry/PortPluginRegistry'

describe('objectPort Instance', () => {
  beforeEach(() => {
    // Clear registry before each test and register needed plugins
    portRegistry.clear()
    portRegistry.register(StringPortPlugin)
    portRegistry.register(NumberPortPlugin)
    portRegistry.register(ObjectPortPlugin)
    portRegistry.register(ArrayPortPlugin) // if nested arrays are used in future tests
  })

  describe('basic Validation', () => {
    it('should validate a correct object port value', () => {
      // Create a simple object schema with two fields: name and age.
      const schema = createObjectSchema({
        name: { type: 'string', minLength: 2 } as StringPortConfig,
        age: { type: 'number', min: 18 } as NumberPortConfig,
      })

      const config = createObjectPortConfig({
        type: 'object',
        schema,
        // Provide a default value that is valid.
        defaultValue: createObjectValue({
          name: { type: 'string', value: 'Alice' } as StringPortValue,
          age: { type: 'number', value: 25 } as NumberPortValue,
        }),
      })

      const port = new ObjectPort(config)
      const value = port.getValue()

      // Validate that the default value passes validation.
      const errors = ObjectPortPlugin.validateValue(value!, config)
      expect(errors).toHaveLength(0)
    })

    it('should report missing and extra fields correctly', () => {
      // Object schema with required fields "name" and "age".
      const schema = createObjectSchema({
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', min: 18 },
      })

      const config = createObjectPortConfig({
        type: 'object',
        schema,
      })

      // Create an object value missing the "age" field and including an extra
      // field "extraField" that is not defined.
      const badValue = createObjectValue({
        name: { type: 'string', value: 'Bob' },
        extraField: { type: 'string', value: 'unexpected' },
      })

      const errors = ObjectPortPlugin.validateValue(badValue, config)
      // Expect one error for the missing "age" and one for the unexpected "extraField"
      expect(errors).toContain('Missing required field: age')
      expect(errors).toContain('Unexpected field: extraField')
    })
  })

  describe('nested Structures', () => {
    it('should validate a complex object port with nested object fields and infer types', () => {
      // Build the tag schema and config:
      const tagSchema = createObjectSchema({
        lol: { type: 'string' } as StringPortConfig,
        kek: { type: 'string' } as StringPortConfig,
      })

      const tagConfig = createObjectPortConfig<typeof tagSchema>({
        type: 'object',
        schema: tagSchema,
        defaultValue: {
          type: 'object',
          value: {
            lol: { type: 'string', value: 'lol' },
            kek: { type: 'string', value: 'kek' },
          },
        },
      })

      // Build user schema and config with nested objects and an array of tags:
      const userSchema = createObjectSchema({
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', min: 21 },
        address: {
          type: 'object',
          schema: createObjectSchema({
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            tags: {
              type: 'array',
              itemConfig: tagConfig,
            } as ArrayPortConfig<typeof tagConfig>,
          }),
        },
      })

      const userConfig = createObjectPortConfig({
        type: 'object',
        schema: userSchema,
        defaultValue: {
          type: 'object',
          value: {
            name: { type: 'string', value: 'Alice' },
            age: { type: 'number', value: 30 },
            address: {
              type: 'object',
              value: {
                street: { type: 'string', value: '123 Main St' },
                city: { type: 'string', value: 'Springfield' },
                state: { type: 'string', value: 'IL' },
                tags: {
                  type: 'array',
                  value: [
                    {
                      type: 'object',
                      value: {
                        lol: { type: 'string', value: 'lol' },
                        kek: { type: 'string', value: 'kek' },
                      },
                    },
                    {
                      type: 'object',
                      value: {
                        lol: { type: 'string', value: 'lol2' },
                        kek: { type: 'string', value: 'kek2' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      })

      const userPort = new ObjectPort(userConfig)
      // We still log some raw access for demonstration.
      console.log(userPort.getValue()?.value.name.value) // 'Alice'
      console.log(userPort.getValue()?.value.address.value.state.value) // 'IL'

      // IMPORTANT: Use the original port structure (userPort.getValue()) with mutableUnwrapPortValue.
      const mutableUnwrappedValue = mutableUnwrapPortValueWithConfig(userPort.getValue(), userConfig)
      if (!mutableUnwrappedValue) {
        throw new Error('Expected mutable unwrapped value to be defined')
      }

      // Update nested field via the mutable proxy.
      mutableUnwrappedValue.address.tags[0].lol = 'new value lol'

      // Expect that the underlying port structure has been updated.
      expect(userPort.getValue()?.value.address.value.tags.value[0].value.lol.value).toBe('new value lol')

      // replace whole array item
      mutableUnwrappedValue.address.tags[0] = {
        lol: 'check this one lol',
        kek: 'check this one kek',
      }

      // Expect that the underlying port structure has been updated.
      expect(userPort.getValue()?.value.address.value.tags.value[0].value.lol.value).toBe('check this one lol')

      // replace whole array
      mutableUnwrappedValue.address.tags = [
        {
          lol: 'new lol',
          kek: 'new kek',
        },
      ]
      expect(userPort.getValue()?.value.address.value.tags.value[0].value.lol.value).toBe('new lol')
      expect(userPort.getValue()?.value.address.value.tags.value[0].value.kek.value).toBe('new kek')

      const mutableUnwrappedValueWithConfig = mutableUnwrapPortValueWithConfig(userPort.getValue(), userConfig)
      if (!mutableUnwrappedValueWithConfig) {
        throw new Error('Expected mutable unwrapped value to be defined')
      }

      // replace whole object
      mutableUnwrappedValueWithConfig.address = {
        street: 'new street',
        city: 'new city',
        state: 'new state',
        tags: [
          {
            lol: 'new lol replaced',
            kek: 'new kek replaced',
          },
        ],
      }

      expect(userPort.getValue()?.value.address.value.street.value).toBe('new street')
      expect(userPort.getValue()?.value.address.value.city.value).toBe('new city')
      expect(userPort.getValue()?.value.address.value.state.value).toBe('new state')
      expect(userPort.getValue()?.value.address.value.tags.value[0].value.lol.value).toBe('new lol replaced')
      expect(userPort.getValue()?.value.address.value.tags.value[0].value.kek.value).toBe('new kek replaced')

      // incorrect type replacement
      try {
        mutableUnwrappedValueWithConfig.address = {
          street: 'new street',
          city: 'new city',
          state: 'new state',
          tags: [
            {
              // @ts-expect-error - invalid field test case
              lol_invalid: 'new lol invalid',
              kek_invalid: 'new kek invalid',
            },
          ],
        }
      } catch (e: any) {
        expect(e.message).toContain('Unexpected field "lol_invalid"')
      }
    })

    it('should validate a complex object port with nested object fields', () => {
      // Create a nested schema: the "address" field itself is an object.
      const addressSchema = createObjectSchema({
        street: { type: 'string' },
        city: { type: 'string', minLength: 3 },
      })

      const schema = createObjectSchema({
        name: { type: 'string', minLength: 2 } as StringPortConfig,
        age: { type: 'number', min: 18 } as NumberPortConfig,
        address: createObjectPortConfig({
          type: 'object',
          schema: addressSchema,
        }),
      })

      const config = createObjectPortConfig<typeof schema>({
        type: 'object',
        schema,
        defaultValue: {
          type: 'object',
          value: {
            name: { type: 'string', value: 'Charlie' },
            age: { type: 'number', value: 30 },
            address: {
              type: 'object',
              value: {
                street: { type: 'string', value: '123 Main St' },
                city: { type: 'string', value: 'New York' },
              },
            },
          },
        },
      })

      const port = new ObjectPort<typeof schema>(config)
      const errors = ObjectPortPlugin.validateValue(port.getValue()!, config)
      expect(errors).toHaveLength(0)

      expect(port.getValue()?.value.address.value.city.value, 'New York')
      expect(port.getValue()?.value.address.value.street.value, '123 Main St')

      // Now introduce an error inside the nested object:
      // Use a too-short city name.
      const badNestedValue = createObjectValue({
        name: { type: 'string', value: 'Charlie' },
        age: { type: 'number', value: 30 },
        address: createObjectValue({
          street: { type: 'string', value: '123 Main St' },
          city: { type: 'string', value: 'NY' }, // too short; expecting at least 3 characters
        }),
      })

      const nestedErrors = ObjectPortPlugin.validateValue(badNestedValue, config)
      expect(nestedErrors.some(msg => msg.includes('at least 3 characters'))).toBe(true)
    })
  })

  describe('serialization and Deserialization', () => {
    it('should serialize and deserialize a simple object port instance correctly', () => {
      const schema = createObjectSchema({
        name: { type: 'string', minLength: 2 } as StringPortConfig,
        score: { type: 'number', min: 0, max: 100 } as NumberPortConfig,
      })
      const config = createObjectPortConfig({
        type: 'object',
        schema,
        defaultValue: createObjectValue({
          name: { type: 'string', value: 'Dana' },
          score: { type: 'number', value: 85 },
        }),
      })

      const port = new ObjectPort(config)
      const originalValue = port.getValue()

      // Serialize the value using ObjectPortPlugin.
      const serialized = ObjectPortPlugin.serializeValue(originalValue!)
      // Optional: convert to JSON string and then parse back to simulate full roundtrip of JSON.
      const jsonString = JSON.stringify(serialized)
      const parsed = JSON.parse(jsonString)

      const deserializedValue = ObjectPortPlugin.deserializeValue(parsed)
      expect(deserializedValue).toEqual(originalValue)
    })

    it('should serialize and deserialize a complex nested object port with arrays', () => {
      // Define a nested schema that includes an array. For example,
      // a "tags" field that is an array of strings.
      const arraySchema: ArrayPortConfig<StringPortConfig> = {
        // For an array field, we simply define the item config.
        type: 'array',
        itemConfig: { type: 'string', minLength: 1 },
        minLength: 1,
        maxLength: 5,
      }

      // Create a top-level object schema including a nested object and array.
      const nestedSchema = createObjectSchema({
        title: { type: 'string', minLength: 3 } as StringPortConfig,
        tags: arraySchema, // Using a raw object here – the plugins should validate that as long as it has type 'array' and valid itemConfig.
      })

      const schema = createObjectSchema({
        id: { type: 'number', min: 1 } as NumberPortConfig,
        content: createObjectPortConfig({
          type: 'object',
          schema: nestedSchema,
        }),
      })

      const config = createObjectPortConfig({
        type: 'object',
        schema,
        defaultValue: createObjectValue<typeof schema>({
          id: { type: 'number', value: 101 },
          content: createObjectValue({
            title: { type: 'string', value: 'Test Article' },
            tags: {
              type: 'array',
              value: [
                { type: 'string', value: 'news' },
                { type: 'string', value: 'tech' },
              ],
            },
          }),
        }),
      })

      const port = new ObjectPort(config)
      const originalValue = port.getValue()

      // Serialize the whole port's value
      const serialized = ObjectPortPlugin.serializeValue(originalValue!)
      // Convert to JSON string to simulate persistence/transmission
      const jsonString = JSON.stringify(serialized)
      // Parse back
      const parsed = JSON.parse(jsonString)
      // Deserialize
      const deserializedValue = ObjectPortPlugin.deserializeValue(parsed)
      expect(deserializedValue).toEqual(originalValue)
    })
  })
})

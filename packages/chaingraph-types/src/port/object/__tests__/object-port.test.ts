import type {
  ArrayPortConfig,
  BooleanPortConfig,
  EnumPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  ObjectSchema,
  StringPortConfig,
} from '@chaingraph/types/port'

import {
  ObjectPort,
  PortKindEnum,
} from '@chaingraph/types/port'
import { registerPortTransformers } from '@chaingraph/types/port/json-transformers'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'

describe('objectPort serialization', () => {
  beforeAll(() => {
    registerPortTransformers()
  })

  it('should correctly serialize and deserialize an ObjectPort with simple properties', () => {
    // Define the object schema
    const objectSchema: ObjectSchema = {
      id: 'simpleSchema',
      type: 'object',
      description: 'A simple object schema',
      properties: {
        name: {
          kind: PortKindEnum.String,
          id: 'name',
          defaultValue: 'Default Name',
        } as StringPortConfig,
        age: {
          kind: PortKindEnum.Number,
          id: 'age',
          defaultValue: 30,
        } as NumberPortConfig,
        isActive: {
          kind: PortKindEnum.Boolean,
          id: 'isActive',
          defaultValue: true,
        } as BooleanPortConfig,
      },
    }

    // Create an ObjectPort instance
    const originalPort = new ObjectPort({
      kind: PortKindEnum.Object,
      id: 'test-object-port',
      schema: objectSchema,
      defaultValue: {
        name: 'Alice',
        age: 25,
        isActive: true,
      },
    } as ObjectPortConfig<typeof objectSchema>)

    // Act
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(ObjectPort)
    if (!(deserialized instanceof ObjectPort)) {
      throw new TypeError('Deserialized port is not an instance of ObjectPort')
    }

    expect(deserialized.config).toEqual(originalPort.config)
    expect(deserialized.getValue()).toEqual(originalPort.getValue())
    expect(deserialized.config.schema).toEqual(objectSchema)
  })

  it('should correctly handle nested ObjectPorts', () => {
    // Define nested object schemas
    const addressSchema: ObjectSchema = {
      id: 'addressSchema',
      type: 'object',
      description: 'Address schema',
      properties: {
        street: {
          kind: PortKindEnum.String,
          id: 'street',
          defaultValue: '123 Main St',
        } as StringPortConfig,
        city: {
          kind: PortKindEnum.String,
          id: 'city',
          defaultValue: 'Anytown',
        } as StringPortConfig,
        postalCode: {
          kind: PortKindEnum.Number,
          id: 'postalCode',
          defaultValue: 12345,
        } as NumberPortConfig,
      },
    }

    const personSchema: ObjectSchema = {
      id: 'personSchema',
      type: 'object',
      description: 'Person schema',
      properties: {
        name: {
          kind: PortKindEnum.String,
          id: 'name',
          defaultValue: 'Bob',
        } as StringPortConfig,
        age: {
          kind: PortKindEnum.Number,
          id: 'age',
          defaultValue: 40,
        } as NumberPortConfig,
        address: {
          kind: PortKindEnum.Object,
          id: 'address',
          schema: addressSchema,
        } as ObjectPortConfig<typeof addressSchema>,
      },
    }

    // Create an ObjectPort instance with nested properties
    const originalPort = new ObjectPort({
      kind: PortKindEnum.Object,
      id: 'nested-object-port',
      schema: personSchema,
      defaultValue: {
        name: 'Charlie',
        age: 35,
        address: {
          street: '456 Elm St',
          city: 'Othertown',
          postalCode: 67890,
        },
      },
    } as ObjectPortConfig<typeof personSchema>) as ObjectPort<typeof personSchema>


    // Act
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(ObjectPort)
    if (!(deserialized instanceof ObjectPort)) {
      throw new TypeError('Deserialized port is not an instance of ObjectPort')
    }

    expect(deserialized.config).toEqual(originalPort.config)
    expect(deserialized.getValue()).toEqual(originalPort.getValue())
    expect(deserialized.config.schema).toEqual(personSchema)
  })

  it('should handle ObjectPort with ArrayPort properties', () => {
    // Define array port config
    const hobbiesArrayConfig: ArrayPortConfig<StringPortConfig> = {
      kind: PortKindEnum.Array,
      id: 'hobbies',
      elementConfig: {
        kind: PortKindEnum.String,
        id: 'hobby',
      } as StringPortConfig,
    }

    // Define object schema with array property
    const profileSchema: ObjectSchema = {
      id: 'profileSchema',
      type: 'object',
      description: 'Profile schema',
      properties: {
        username: {
          kind: PortKindEnum.String,
          id: 'username',
          defaultValue: 'user123',
        } as StringPortConfig,
        hobbies: hobbiesArrayConfig,
      },
    }

    // Create ObjectPort
    const originalPort = new ObjectPort({
      kind: PortKindEnum.Object,
      id: 'profile-object-port',
      schema: profileSchema,
      defaultValue: {
        username: 'johndoe',
        hobbies: ['reading', 'coding', 'gaming'],
      },
    } as ObjectPortConfig<typeof profileSchema>)

    // Act
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(ObjectPort)
    if (!(deserialized instanceof ObjectPort)) {
      throw new TypeError('Deserialized port is not an instance of ObjectPort')
    }

    expect(deserialized.config).toEqual(originalPort.config)
    expect(deserialized.getValue()).toEqual(originalPort.getValue())
    expect(deserialized.config.schema).toEqual(profileSchema)
  })

  it('should preserve complex configuration and metadata', () => {
    // Define complex object schema
    const complexSchema: ObjectSchema = {
      id: 'complexSchema',
      type: 'object',
      description: 'Complex object schema',
      properties: {
        title: {
          kind: PortKindEnum.String,
          id: 'title',
          optional: true,
          metadata: {
            displayName: 'Title',
            description: 'The title of the item',
          },
        } as StringPortConfig,
        value: {
          kind: PortKindEnum.Number,
          id: 'value',
          validation: {
            min: 0,
            max: 100,
          },
        } as NumberPortConfig,
        tags: {
          kind: PortKindEnum.Array,
          id: 'tags',
          elementConfig: {
            kind: PortKindEnum.String,
            id: 'tag',
          } as StringPortConfig,
        } as ArrayPortConfig<StringPortConfig>,
        settings: {
          kind: PortKindEnum.Object,
          id: 'settings',
          schema: {
            id: 'settingsSchema',
            type: 'object',
            properties: {
              enabled: {
                kind: PortKindEnum.Boolean,
                id: 'enabled',
                defaultValue: true,
              } as BooleanPortConfig,
              mode: {
                kind: PortKindEnum.Enum,
                id: 'mode',
                options: [
                  {
                    kind: PortKindEnum.String,
                    id: 'mode1',
                    defaultValue: 'Mode 1',
                  } as StringPortConfig,
                  {
                    kind: PortKindEnum.String,
                    id: 'mode2',
                    defaultValue: 'Mode 2',
                  } as StringPortConfig,
                ],
                defaultValue: 'mode1',
              } as EnumPortConfig<StringPortConfig>,
            },
          } as ObjectSchema,
        } as ObjectPortConfig<ObjectSchema>,
      },
    }

    // Create ObjectPort
    const originalPort = new ObjectPort({
      kind: PortKindEnum.Object,
      id: 'complex-object-port',
      title: 'Complex Object Port',
      description: 'An object port with complex configuration and metadata',
      metadata: {
        category: 'test',
        importance: 'high',
      },
      schema: complexSchema,
      defaultValue: {
        title: 'Example Item',
        value: 75,
        tags: ['example', 'test'],
        settings: {
          enabled: false,
          mode: 'mode2',
        },
      },
    } as ObjectPortConfig<typeof complexSchema>)

    // Act
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(ObjectPort)
    if (!(deserialized instanceof ObjectPort)) {
      throw new TypeError('Deserialized port is not an instance of ObjectPort')
    }

    // Check configuration and metadata
    expect(deserialized.config).toEqual(originalPort.config)
    expect(deserialized.config.metadata).toEqual(originalPort.config.metadata)
    expect(deserialized.config.title).toBe(originalPort.config.title)
    expect(deserialized.config.description).toBe(originalPort.config.description)

    // Check schema
    expect(deserialized.config.schema).toEqual(complexSchema)

    // Check values
    expect(deserialized.getValue()).toEqual(originalPort.getValue())
  })

  it('should handle empty ObjectPort with no properties', () => {
    // Define an empty object schema
    const emptySchema: ObjectSchema = {
      id: 'emptySchema',
      type: 'object',
      properties: {},
    }

    // Create ObjectPort
    const originalPort = new ObjectPort({
      kind: PortKindEnum.Object,
      id: 'empty-object-port',
      schema: emptySchema,
      defaultValue: {},
    } as ObjectPortConfig<typeof emptySchema>)

    // Act
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(ObjectPort)
    if (!(deserialized instanceof ObjectPort)) {
      throw new TypeError('Deserialized port is not an instance of ObjectPort')
    }

    expect(deserialized.getValue()).toEqual({})
    expect(deserialized.config.schema).toEqual(emptySchema)
  })
})

import { describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { isPortType, validatePortConfig, validatePortConfigType } from '../validation'

describe('object port configurations', () => {
  describe('simple object ports', () => {
    const simpleObjectConfig = {
      type: PortType.Object,
      id: 'test-simple-object',
      title: 'Test Simple Object',
      direction: PortDirection.Input,
      schema: {
        properties: {
          name: {
            type: PortType.String,
            validation: {
              minLength: 1,
              maxLength: 100,
            },
          },
          age: {
            type: PortType.Number,
            validation: {
              min: 0,
              max: 150,
              integer: true,
            },
          },
          isActive: {
            type: PortType.Boolean,
          },
        },
      },
    }

    it('should validate correct object config', () => {
      const validated = validatePortConfigType(simpleObjectConfig, PortType.Object)
      expect(isPortType(validated, PortType.Object)).toBe(true)
    })

    it('should validate object with valid default value', () => {
      const configWithDefault = {
        ...simpleObjectConfig,
        defaultValue: {
          name: 'John Doe',
          age: 30,
          isActive: true,
        },
      }
      const validated = validatePortConfigType(configWithDefault, PortType.Object)
      expect(validated.defaultValue).toEqual({
        name: 'John Doe',
        age: 30,
        isActive: true,
      })
    })
  })

  describe('nested object ports', () => {
    const nestedObjectConfig = {
      type: PortType.Object,
      id: 'test-nested-object',
      title: 'Test Nested Object',
      direction: PortDirection.Input,
      schema: {
        properties: {
          user: {
            type: PortType.Object,
            schema: {
              properties: {
                name: {
                  type: PortType.String,
                  validation: { minLength: 1 },
                },
                contact: {
                  type: PortType.Object,
                  schema: {
                    properties: {
                      email: {
                        type: PortType.String,
                      },
                      phone: {
                        type: PortType.String,
                      },
                    },
                  },
                },
              },
            },
          },
          settings: {
            type: PortType.Object,
            schema: {
              properties: {
                theme: {
                  type: PortType.String,
                },
                notifications: {
                  type: PortType.Boolean,
                },
              },
            },
          },
        },
      },
    }

    it('should validate correct nested object config', () => {
      const validated = validatePortConfigType(nestedObjectConfig, PortType.Object)
      expect(isPortType(validated, PortType.Object)).toBe(true)
    })

    it('should validate nested object with valid data', () => {
      const configWithDefault = {
        ...nestedObjectConfig,
        defaultValue: {
          user: {
            name: 'John Doe',
            contact: {
              email: 'john@example.com',
              phone: '+1234567890',
            },
          },
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
      }
      const validated = validatePortConfigType(configWithDefault, PortType.Object)
      expect(validated.defaultValue).toEqual({
        user: {
          name: 'John Doe',
          contact: {
            email: 'john@example.com',
            phone: '+1234567890',
          },
        },
        settings: {
          theme: 'dark',
          notifications: true,
        },
      })
    })
  })

  describe('object with array properties', () => {
    const objectWithArrayConfig = {
      type: PortType.Object,
      id: 'test-object-with-array',
      title: 'Test Object With Array',
      direction: PortDirection.Input,
      schema: {
        properties: {
          name: {
            type: PortType.String,
          },
          tags: {
            type: PortType.Array,
            elementConfig: {
              type: PortType.String,
              validation: {
                minLength: 1,
                maxLength: 20,
              },
            },
          },
        },
      },
    }

    it('should validate object with array property', () => {
      const configWithDefault = {
        ...objectWithArrayConfig,
        defaultValue: {
          name: 'Test Item',
          tags: ['tag1', 'tag2', 'tag3'],
        },
      }
      const validated = validatePortConfigType(configWithDefault, PortType.Object)
      expect(validated.defaultValue).toEqual({
        name: 'Test Item',
        tags: ['tag1', 'tag2', 'tag3'],
      })
    })
  })

  describe('error cases', () => {
    it('should reject object with invalid property type', () => {
      const invalidConfig = {
        type: PortType.Object,
        schema: {
          properties: {
            field: {
              type: 'invalid' as PortType,
            },
          },
        },
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })

    it('should reject object with missing schema', () => {
      const invalidConfig = {
        type: PortType.Object,
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })

    it('should reject object with invalid nested validation', () => {
      const invalidConfig = {
        type: PortType.Object,
        schema: {
          properties: {
            nested: {
              type: PortType.Object,
              schema: {
                properties: {
                  number: {
                    type: PortType.Number,
                    validation: {
                      min: 100,
                      max: 0, // Invalid: max less than min
                    },
                  },
                },
              },
            },
          },
        },
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })
  })
})

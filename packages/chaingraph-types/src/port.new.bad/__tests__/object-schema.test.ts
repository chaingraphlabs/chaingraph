import { describe, expect, it } from 'vitest'
import { PortType } from '../config/constants'
import { objectPortSchema } from '../validation'

describe('object port schema', () => {
  describe('basic object configuration', () => {
    it('should validate simple object schema through JSON', () => {
      const config = {
        type: PortType.Object,
        schema: {
          properties: {
            name: {
              type: PortType.String,
            },
            age: {
              type: PortType.Number,
            },
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate object with default value through JSON', () => {
      const config = {
        type: PortType.Object,
        schema: {
          properties: {
            name: {
              type: PortType.String,
            },
            age: {
              type: PortType.Number,
            },
          },
        },
        defaultValue: {
          name: 'John',
          age: 30,
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate object with property validation through JSON', () => {
      const config = {
        type: PortType.Object,
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
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })
  })

  describe('nested object configuration', () => {
    it('should validate nested object schema through JSON', () => {
      const config = {
        type: PortType.Object,
        schema: {
          properties: {
            user: {
              type: PortType.Object,
              schema: {
                properties: {
                  name: {
                    type: PortType.String,
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
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate nested object with default values through JSON', () => {
      const config = {
        type: PortType.Object,
        schema: {
          properties: {
            user: {
              type: PortType.Object,
              schema: {
                properties: {
                  name: {
                    type: PortType.String,
                  },
                  contact: {
                    type: PortType.Object,
                    schema: {
                      properties: {
                        email: {
                          type: PortType.String,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        defaultValue: {
          user: {
            name: 'John',
            contact: {
              email: 'john@example.com',
            },
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })
  })

  describe('object with array properties', () => {
    it('should validate object with array property through JSON', () => {
      const config = {
        type: PortType.Object,
        schema: {
          properties: {
            name: {
              type: PortType.String,
            },
            tags: {
              type: PortType.Array,
              elementConfig: {
                type: PortType.String,
              },
            },
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate object with array of objects through JSON', () => {
      const config = {
        type: PortType.Object,
        schema: {
          properties: {
            items: {
              type: PortType.Array,
              elementConfig: {
                type: PortType.Object,
                schema: {
                  properties: {
                    id: {
                      type: PortType.String,
                    },
                    value: {
                      type: PortType.Number,
                    },
                  },
                },
              },
            },
          },
        },
        defaultValue: {
          items: [
            { id: '1', value: 10 },
            { id: '2', value: 20 },
          ],
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })
  })

  describe('error cases', () => {
    it('should reject missing schema through JSON', () => {
      const config = {
        type: PortType.Object,
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject invalid property type through JSON', () => {
      const config = {
        type: PortType.Object,
        schema: {
          properties: {
            field: {
              type: 'invalid' as PortType,
            },
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject non-object default value through JSON', () => {
      const config = {
        type: PortType.Object,
        schema: {
          properties: {
            name: {
              type: PortType.String,
            },
          },
        },
        defaultValue: 'not an object', // Invalid: string instead of object
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })
  })

  describe('common port properties', () => {
    it('should validate optional properties through JSON', () => {
      const config = {
        type: PortType.Object,
        schema: {
          properties: {
            name: {
              type: PortType.String,
            },
          },
        },
        id: 'test-id',
        title: 'Test Port',
        description: 'A test port',
        optional: true,
        metadata: {
          custom: 'value',
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should reject invalid metadata type through JSON', () => {
      const config = {
        type: PortType.Object,
        schema: {
          properties: {
            name: {
              type: PortType.String,
            },
          },
        },
        metadata: 'not an object', // Invalid: string instead of object
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = objectPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })
  })
})

import type { ConfigFromPortType } from '../config/types'
import { beforeAll, describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { ObjectPort } from '../ports/object.port'
import { registerTestPorts } from '../registry/register-ports'

describe('object port', () => {
  // Register required port types before running tests
  beforeAll(() => {
    registerTestPorts(
      PortType.Object, // For object port itself
      PortType.String, // For string properties
      PortType.Number, // For number properties
      PortType.Boolean, // For boolean properties
    )
  })

  describe('basic functionality', () => {
    it('should create object port with minimal config', () => {
      const config: ConfigFromPortType<PortType.Object> = {
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
            age: { type: PortType.Number },
          },
        },
      }

      const port = new ObjectPort(config)
      expect(port.config).toEqual(config)
      expect(port.hasValue()).toBe(false)
    })

    it('should handle default value', () => {
      const config: ConfigFromPortType<PortType.Object> = {
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
            age: { type: PortType.Number },
          },
        },
        defaultValue: {
          name: 'John',
          age: 30,
        },
      }

      const port = new ObjectPort(config)
      expect(port.hasValue()).toBe(true)
      expect(port.getValue()).toEqual({
        name: 'John',
        age: 30,
      })
    })

    it('should set and get value', () => {
      type Person = Record<string, unknown> & {
        name: string
        age: number
      }

      const port = new ObjectPort<Person>({
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
            age: { type: PortType.Number },
          },
        },
      })

      const person: Person = {
        name: 'John',
        age: 30,
      }

      port.setValue(person)
      expect(port.getValue()).toEqual(person)
    })

    it('should reset value', () => {
      const port = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
            age: { type: PortType.Number },
          },
        },
      })

      port.setValue({ name: 'John', age: 30 })
      port.reset()
      expect(port.hasValue()).toBe(false)
    })

    it('should handle partial objects', () => {
      const port = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
            age: { type: PortType.Number },
          },
        },
      })

      // Only setting name property
      port.setValue({ name: 'John' })
      expect(port.getValue()).toEqual({ name: 'John' })
    })
  })

  describe('validation', () => {
    it('should validate string properties', () => {
      const port = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: {
              type: PortType.String,
              validation: {
                minLength: 2,
                maxLength: 5,
              },
            },
          },
        },
      })

      expect(() => port.setValue({ name: 'John' })).not.toThrow()
      expect(() => port.setValue({ name: 'J' })).toThrow() // Too short
      expect(() => port.setValue({ name: 'Johnny' })).toThrow() // Too long
    })

    it('should validate number properties', () => {
      const port = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            age: {
              type: PortType.Number,
              validation: {
                min: 0,
                max: 100,
                integer: true,
              },
            },
          },
        },
      })

      expect(() => port.setValue({ age: 30 })).not.toThrow()
      expect(() => port.setValue({ age: -1 })).toThrow() // Below min
      expect(() => port.setValue({ age: 101 })).toThrow() // Above max
      expect(() => port.setValue({ age: 30.5 })).toThrow() // Not integer
    })

    it('should validate boolean properties', () => {
      const port = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            active: { type: PortType.Boolean },
          },
        },
      })

      expect(() => port.setValue({ active: true })).not.toThrow()
      expect(() => port.setValue({ active: false })).not.toThrow()
      expect(() => port.setValue({ active: 'true' as any })).toThrow() // Invalid type
      expect(() => port.setValue({ active: 1 as any })).toThrow() // Invalid type
    })
  })

  describe('error handling', () => {
    it('should reject missing schema', () => {
      const invalidConfig = {
        type: PortType.Object,
      } as const

      // @ts-expect-error - Testing invalid config
      expect(() => new ObjectPort(invalidConfig)).toThrow()
    })

    it('should reject invalid property type', () => {
      const invalidConfig = {
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: 'invalid' as PortType },
          },
        },
      } as const

      // @ts-expect-error - Testing invalid config
      expect(() => new ObjectPort(invalidConfig)).toThrow()
    })

    it('should reject non-object values', () => {
      const port = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
          },
        },
      })

      expect(() => port.setValue('not an object' as any)).toThrow()
      expect(() => port.setValue(42 as any)).toThrow()
      expect(() => port.setValue([] as any)).toThrow()
      expect(() => port.setValue(null as any)).toThrow()
    })
  })

  describe('common port properties', () => {
    it('should handle optional properties', () => {
      const port = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
          },
        },
        id: 'test-id',
        title: 'Test Port',
        description: 'A test port',
        direction: PortDirection.Input,
        optional: true,
        metadata: {
          custom: 'value',
        },
      })

      expect(port.config.id).toBe('test-id')
      expect(port.config.title).toBe('Test Port')
      expect(port.config.description).toBe('A test port')
      expect(port.config.direction).toBe(PortDirection.Input)
      expect(port.config.optional).toBe(true)
      expect(port.config.metadata).toEqual({ custom: 'value' })
    })
  })

  describe('events', () => {
    it('should emit value change events', () => {
      const port = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
          },
        },
      })
      const events: any[] = []

      port.on('value:change', (event, data) => {
        events.push({ event, data })
      })

      port.setValue({ name: 'John' })
      port.setValue({ name: 'Jane' })

      expect(events).toHaveLength(2)
      expect(events[0].data).toEqual({
        oldValue: undefined,
        newValue: { name: 'John' },
      })
      expect(events[1].data).toEqual({
        oldValue: { name: 'John' },
        newValue: { name: 'Jane' },
      })
    })

    it('should emit reset events', () => {
      const port = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
          },
        },
      })
      const events: any[] = []

      port.setValue({ name: 'John' })
      port.on('value:reset', (event, data) => {
        events.push({ event, data })
      })

      port.reset()

      expect(events).toHaveLength(1)
      expect(events[0].data).toEqual({
        oldValue: { name: 'John' },
      })
    })
  })
})

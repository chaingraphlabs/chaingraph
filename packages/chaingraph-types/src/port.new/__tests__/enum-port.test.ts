import { beforeAll, describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { EnumPort, registerEnumPort } from '../ports/enum.port'
import { PortFactory } from '../registry/port-factory'

describe('enum port', () => {
  beforeAll(() => {
    registerEnumPort()
  })

  describe('basic functionality', () => {
    it('should create enum port with options', () => {
      const config = {
        type: PortType.Enum as const,
        options: [
          {
            id: 'option1',
            type: PortType.String as const,
            title: 'Option 1',
          },
          {
            id: 'option2',
            type: PortType.Number as const,
            title: 'Option 2',
          },
        ],
      }

      const port = new EnumPort(config)
      expect(port.config).toEqual(config)
      expect(port.hasValue()).toBe(false)
    })

    it('should handle default value', () => {
      const config = {
        type: PortType.Enum as const,
        options: [
          {
            id: 'option1',
            type: PortType.String as const,
            title: 'Option 1',
          },
          {
            id: 'option2',
            type: PortType.Number as const,
            title: 'Option 2',
          },
        ],
        defaultValue: 'option1',
      }

      const port = new EnumPort(config)
      expect(port.hasValue()).toBe(true)
      expect(port.getValue()).toBe('option1')
      expect(port.getSelectedOption()).toEqual(config.options[0])
    })

    it('should set and get value by option id', () => {
      const config = {
        type: PortType.Enum as const,
        options: [
          {
            id: 'option1',
            type: PortType.String as const,
            title: 'Option 1',
          },
          {
            id: 'option2',
            type: PortType.Number as const,
            title: 'Option 2',
          },
        ],
      }

      const port = new EnumPort(config)

      port.setValue('option1')
      expect(port.getValue()).toBe('option1')
      expect(port.getSelectedOption()).toEqual(config.options[0])

      port.setValue('option2')
      expect(port.getValue()).toBe('option2')
      expect(port.getSelectedOption()).toEqual(config.options[1])

      expect(() => port.setValue('invalid')).toThrow()
    })
  })

  describe('validation', () => {
    it('should validate option ids', () => {
      const config = {
        type: PortType.Enum as const,
        options: [
          {
            id: 'option1',
            type: PortType.String as const,
            title: 'Option 1',
          },
        ],
      }

      const port = new EnumPort(config)

      // Valid option id
      expect(() => port.setValue('option1')).not.toThrow()

      // Invalid option id
      expect(() => port.setValue('invalid')).toThrow()
      expect(() => port.setValue('')).toThrow()
    })

    it('should require options to have ids', () => {
      const config = {
        type: PortType.Enum as const,
        options: [
          {
            type: PortType.String as const,
            title: 'Option 1',
          },
        ],
      }

      const port = new EnumPort(config)
      expect(() => port.setValue('option1')).toThrow()
    })
  })

  describe('factory registration', () => {
    it('should create enum port through factory', () => {
      const config = {
        type: PortType.Enum as const,
        options: [
          {
            id: 'option1',
            type: PortType.String as const,
            title: 'Option 1',
          },
        ],
      }

      const port = PortFactory.create(config)
      expect(port).toBeInstanceOf(EnumPort)

      port.setValue('option1')
      expect(port.getValue()).toBe('option1')

      expect(() => port.setValue('invalid')).toThrow()
    })
  })

  describe('common port properties', () => {
    it('should handle optional properties', () => {
      const port = new EnumPort({
        type: PortType.Enum as const,
        id: 'test-enum',
        title: 'Test Enum',
        description: 'A test enum port',
        direction: PortDirection.Input,
        optional: true,
        metadata: {
          custom: 'value',
        },
        options: [
          {
            id: 'option1',
            type: PortType.String as const,
            title: 'Option 1',
          },
        ],
      })

      expect(port.config.id).toBe('test-enum')
      expect(port.config.title).toBe('Test Enum')
      expect(port.config.description).toBe('A test enum port')
      expect(port.config.direction).toBe(PortDirection.Input)
      expect(port.config.optional).toBe(true)
      expect(port.config.metadata).toEqual({ custom: 'value' })
    })
  })
})

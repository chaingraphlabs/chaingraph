import type { PortEventHandler } from '../base/port.interface'
import { describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { BooleanPort } from '../ports/boolean.port'

describe('boolean port json serialization', () => {
  describe('basic serialization', () => {
    it('should handle full serialization cycle with minimal config', () => {
      // Create original port
      const originalPort = new BooleanPort({
        type: PortType.Boolean,
      })
      originalPort.setValue(true)

      // Serialize to JSON string
      const serialized = originalPort.serialize()
      const jsonString = JSON.stringify(serialized)

      // Deserialize from JSON string
      const parsed = JSON.parse(jsonString)
      const restoredPort = originalPort.deserialize(parsed)

      // Verify restored port
      expect(restoredPort.config).toEqual(originalPort.config)
      expect(restoredPort.getValue()).toBe(true)
    })

    it('should handle full serialization cycle with complete config', () => {
      // Create original port
      const originalPort = new BooleanPort({
        type: PortType.Boolean,
        id: 'test-id',
        title: 'Test Port',
        description: 'A test port',
        direction: PortDirection.Input,
        defaultValue: false,
        metadata: {
          custom: 'value',
        },
      })
      originalPort.setValue(true)

      // Serialize to JSON string
      const serialized = originalPort.serialize()
      const jsonString = JSON.stringify(serialized)

      // Deserialize from JSON string
      const parsed = JSON.parse(jsonString)
      const restoredPort = originalPort.deserialize(parsed)

      // Verify restored port
      expect(restoredPort.config).toEqual(originalPort.config)
      expect(restoredPort.getValue()).toBe(true)
      expect(restoredPort.getMetadata('custom')).toBe('value')
    })
  })

  describe('event handling', () => {
    it('should maintain event handlers after serialization', () => {
      // Create original port
      const originalPort = new BooleanPort({
        type: PortType.Boolean,
      })

      // Add event handler
      const changes: Array<{ oldValue: boolean | undefined, newValue: boolean }> = []
      const handler: PortEventHandler = (_event, data) => {
        changes.push(data as { oldValue: boolean | undefined, newValue: boolean })
      }
      originalPort.on('value:change', handler)

      // Serialize and deserialize
      const serialized = originalPort.serialize()
      const jsonString = JSON.stringify(serialized)
      const parsed = JSON.parse(jsonString)
      const restoredPort = originalPort.deserialize(parsed)

      // Add same handler to restored port
      restoredPort.on('value:change', handler)

      // Test event handling
      restoredPort.setValue(true)
      restoredPort.setValue(false)

      expect(changes).toEqual([
        { oldValue: undefined, newValue: true },
        { oldValue: true, newValue: false },
      ])
    })
  })

  describe('error handling', () => {
    it('should reject invalid JSON', () => {
      const originalPort = new BooleanPort({
        type: PortType.Boolean,
      })

      const invalidJson = '{ invalid json }'
      expect(() => {
        const parsed = JSON.parse(invalidJson)
        originalPort.deserialize(parsed)
      }).toThrow()
    })

    it('should reject JSON with invalid port configuration', () => {
      const originalPort = new BooleanPort({
        type: PortType.Boolean,
      })

      const invalidConfig = {
        config: {
          type: PortType.String, // Wrong type
        },
        value: true,
      }

      const jsonString = JSON.stringify(invalidConfig)
      expect(() => {
        const parsed = JSON.parse(jsonString)
        originalPort.deserialize(parsed)
      }).toThrow()
    })

    it('should reject JSON with invalid port value', () => {
      const originalPort = new BooleanPort({
        type: PortType.Boolean,
      })

      const invalidValue = {
        config: {
          type: PortType.Boolean,
        },
        value: 'not a boolean', // Invalid value type
      }

      const jsonString = JSON.stringify(invalidValue)
      expect(() => {
        const parsed = JSON.parse(jsonString)
        originalPort.deserialize(parsed)
      }).toThrow()
    })
  })
})

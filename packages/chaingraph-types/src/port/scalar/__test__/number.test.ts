import { NumberPort, registerPortTransformers } from '@chaingraph/types'
import { PortDirection } from '@chaingraph/types/port/types/port-direction-union'
import { PortKind } from '@chaingraph/types/port/types/port-kind'
import Decimal from 'decimal.js'
import superjson from 'superjson'
import { describe, expect, it } from 'vitest'

describe('numberPort serialization', () => {
  registerPortTransformers()

  it('should correctly serialize and deserialize NumberPort with different value types', () => {
    // Arrange
    const originalPort = new NumberPort({
      kind: PortKind.Number,
      id: 'test-port',
      direction: PortDirection.Input,
      defaultValue: 42,
    })

    // Test different value types
    const testCases = [
      123, // number
      '456.789', // string
      new Decimal('123.45'), // Decimal
      new Decimal('123.454518194012923782873462345'), // Decimal
    ]

    for (const value of testCases) {
      // Arrange
      originalPort.setValue(value)

      // Act
      const serialized = superjson.stringify(originalPort)
      const deserialized = superjson.parse(serialized)

      // Assert
      expect(deserialized).toBeInstanceOf(NumberPort)
      if (!(deserialized instanceof NumberPort)) {
        continue
      }

      expect(deserialized.config).toEqual(originalPort.config)
      expect(deserialized.getValue()).toEqual(originalPort.getValue())
    }
  })
})

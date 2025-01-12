import type { BooleanPortConfig } from '@chaingraph/types/port/types/port-config'
import { BooleanPort } from '@chaingraph/types'
import { registerPortTransformers } from '@chaingraph/types/port/port-transformers'
import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'
import superjson from 'superjson'
import { describe, expect, it } from 'vitest'

describe('booleanPort serialization', () => {
  registerPortTransformers()

  it('should correctly serialize and deserialize BooleanPort with different value types', () => {
    // Arrange
    const originalPort = new BooleanPort({
      kind: PortKindEnum.Boolean,
      id: 'test-boolean-port',
      direction: PortDirectionEnum.Input,
      defaultValue: false,
    })

    // Test both boolean values
    const testCases = [
      true,
      false,
    ]

    for (const value of testCases) {
      // Arrange
      originalPort.setValue(value)

      // Act
      const serialized = superjson.stringify(originalPort)
      const deserialized = superjson.parse(serialized)

      // Assert
      expect(deserialized).toBeInstanceOf(BooleanPort)
      if (!(deserialized instanceof BooleanPort)) {
        continue
      }

      expect(deserialized.config).toEqual(originalPort.config)
      expect(deserialized.getValue()).toEqual(originalPort.getValue())
    }
  })

  it('should preserve port configuration after serialization', () => {
    // Arrange
    const config = {
      kind: PortKindEnum.Boolean,
      id: 'test-boolean-port',
      direction: PortDirectionEnum.Output,
      defaultValue: true,
      optional: true,
      title: 'Test Boolean Port',
      description: 'A test boolean port',
      metadata: {
        testKey: 'testValue',
      },
    } as BooleanPortConfig

    const originalPort = new BooleanPort(config)
    originalPort.setValue(true)

    // Act
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(BooleanPort)
    if (!(deserialized instanceof BooleanPort)) {
      return
    }

    // Check all config properties are preserved
    expect(deserialized.config).toEqual(config)
    expect(deserialized.id).toBe(config.id)
    expect(deserialized.direction).toBe(config.direction)
    expect(deserialized.optional).toBe(config.optional)
    expect(deserialized.title).toBe(config.title)
    expect(deserialized.description).toBe(config.description)
    expect(deserialized.metadata('testKey')).toBe(config.metadata?.testKey)
  })
})

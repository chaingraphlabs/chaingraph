import type {
  AnyPortConfig,
  NumberPortConfig,
  PortConfig,
  StringPortConfig,
} from '@chaingraph/types'
import {
  AnyPort,
  PortDirectionEnum,
  PortKindEnum,
} from '@chaingraph/types'
import { registerPortTransformers } from '@chaingraph/types/port/json-transformers'
import Decimal from 'decimal.js'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'

describe('anyPort serialization', () => {
  beforeAll(() => {
    registerPortTransformers()
  })

  it('should correctly serialize and deserialize AnyPort without connected port', () => {
    // Arrange
    const originalPort = new AnyPort({
      kind: PortKindEnum.Any,
      id: 'test-any-port',
      direction: PortDirectionEnum.Input,
      defaultValue: 'some value',
    })

    // Test different value types
    const testCases = [
      'string value',
      123,
      true,
      null,
      undefined,
      { key: 'value' },
      [1, 2, 3],
      // new Date(),
      // Symbol('test'),
      // BigInt('9007199254740991'),
    ]

    for (const value of testCases) {
      // Arrange
      originalPort.setValue(value)

      // Act
      const serialized = superjson.stringify(originalPort)
      const deserialized = superjson.parse(serialized)

      // Assert
      expect(deserialized).toBeInstanceOf(AnyPort)
      if (!(deserialized instanceof AnyPort)) {
        continue
      }

      expect(deserialized.config).toEqual(originalPort.config)
      expect(deserialized.getValue()).toEqual(originalPort.getValue())
    }
  })

  it('should correctly serialize and deserialize AnyPort with connected port', () => {
    // Arrange
    const connectedPortConfig = {
      kind: PortKindEnum.String,
      id: 'connected-port',
      defaultValue: 'default string',
    } as StringPortConfig

    const originalPort = new AnyPort({
      kind: PortKindEnum.Any,
      id: 'test-any-port-connected',
      direction: PortDirectionEnum.Input,
      connectedPortConfig,
    })

    // Test setting values compatible with connected port
    const testCases = [
      'valid string',
      'another string',
    ]

    for (const value of testCases) {
      // Arrange
      originalPort.setValue(value)

      // Act
      const serialized = superjson.stringify(originalPort)
      const deserialized = superjson.parse(serialized)

      // Assert
      expect(deserialized).toBeInstanceOf(AnyPort)
      if (!(deserialized instanceof AnyPort)) {
        continue
      }

      expect(deserialized.config).toEqual(originalPort.config)
      expect(deserialized.getValue()).toEqual(originalPort.getValue())
      expect(deserialized.config.connectedPortConfig).toEqual(connectedPortConfig)
    }
  })

  it('should handle invalid values when connected to a port with specific type', () => {
    // Arrange
    const connectedPortConfig = {
      kind: PortKindEnum.Number,
      id: 'connected-number-port',
      defaultValue: 0,
    } as NumberPortConfig

    const originalPort = new AnyPort({
      kind: PortKindEnum.Any,
      id: 'test-any-port-connected-number',
      direction: PortDirectionEnum.Input,
      connectedPortConfig,
    })

    // Act & Assert
    expect(() => originalPort.setValue('invalid string')).toThrowError()
    expect(() => originalPort.setValue(true)).toThrowError()
    expect(() => originalPort.setValue({})).toThrowError()

    // Valid value
    originalPort.setValue(123)
    expect(originalPort.getValue()).toEqual(new Decimal(123))

    // Serialize and deserialize
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    expect(deserialized).toBeInstanceOf(AnyPort)
    if (deserialized instanceof AnyPort) {
      expect(deserialized.getValue()).toEqual(new Decimal(123))
      expect(deserialized.config.connectedPortConfig).toEqual(connectedPortConfig)
    }
  })

  it('should preserve configuration and value after serialization', () => {
    // Arrange
    const connectedPortConfig: PortConfig = {
      kind: PortKindEnum.Boolean,
      id: 'connected-boolean-port',
      defaultValue: true,
    }

    const config = {
      kind: PortKindEnum.Any,
      id: 'complex-any-port',
      direction: PortDirectionEnum.Output,
      optional: true,
      title: 'Complex Any Port',
      description: 'A test any port with complex configuration',
      metadata: {
        category: 'test',
        priority: 1,
      },
      connectedPortConfig,
      defaultValue: false,
    } as AnyPortConfig

    const originalPort = new AnyPort(config)

    // Act
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(AnyPort)
    if (!(deserialized instanceof AnyPort)) {
      return
    }

    // Check all config properties are preserved
    expect(deserialized.config).toEqual(config)
    expect(deserialized.id).toBe(config.id)
    expect(deserialized.direction).toBe(config.direction)
    expect(deserialized.optional).toBe(config.optional)
    expect(deserialized.title).toBe(config.title)
    expect(deserialized.description).toBe(config.description)
    expect(deserialized.metadata('category')).toBe(config.metadata?.category)
    expect(deserialized.metadata('priority')).toBe(config.metadata?.priority)
    expect(deserialized.config.connectedPortConfig).toEqual(config.connectedPortConfig)
    expect(deserialized.getValue()).toEqual(originalPort.getValue())
  })
})

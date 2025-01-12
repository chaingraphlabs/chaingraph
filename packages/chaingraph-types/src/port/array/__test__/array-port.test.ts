import type {
  ArrayPortConfig,
  NumberPortConfig,
  StringPortConfig,
} from '@chaingraph/types/port/types/port-config'
import { ArrayPort } from '@chaingraph/types'
import { registerPortTransformers } from '@chaingraph/types/port/port-transformers'
import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'
import Decimal from 'decimal.js'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'

describe('arrayPort serialization', () => {
  beforeAll(() => {
    registerPortTransformers()
  })

  it('should correctly serialize and deserialize ArrayPort with string elements', () => {
    // Arrange
    const elementConfig = {
      kind: PortKindEnum.String,
      id: 'string-element',
    } as StringPortConfig

    const originalPort = new ArrayPort({
      kind: PortKindEnum.Array,
      id: 'test-array-port',
      direction: PortDirectionEnum.Input,
      elementConfig,
      defaultValue: ['one', 'two', 'three'],
    })

    // Test different array values
    const testCases = [
      [],
      ['single value'],
      ['multiple', 'string', 'values'],
      ['special chars !@#$%^&*()'],
      ['unicode', '你好世界', '❤️'],
    ]

    for (const value of testCases) {
      // Arrange
      originalPort.setValue(value)

      // Act
      const serialized = superjson.stringify(originalPort)
      const deserialized = superjson.parse(serialized)

      // Assert
      expect(deserialized).toBeInstanceOf(ArrayPort)
      if (!(deserialized instanceof ArrayPort)) {
        continue
      }

      expect(deserialized.config).toEqual(originalPort.config)
      expect(deserialized.getValue()).toEqual(originalPort.getValue())
      expect(deserialized.config.elementConfig).toEqual(elementConfig)
    }
  })

  it('should correctly serialize and deserialize ArrayPort with number elements', () => {
    // Arrange
    const elementConfig = {
      kind: PortKindEnum.Number,
      id: 'number-element',
    } as NumberPortConfig

    const originalPort = new ArrayPort({
      kind: PortKindEnum.Array,
      id: 'test-number-array-port',
      direction: PortDirectionEnum.Input,
      elementConfig,
      defaultValue: [1, 2, 3],
    })

    // Test different number array values
    const testCases = [
      [],
      [42],
      [1, 2, 3, 4, 5],
      [-1, 0, 1],
      [new Decimal('123.45')],
      [new Decimal('123.454518194012923782873462345')],
      ['123.45', 42, new Decimal('789.01')], // Mixed number representations
    ]

    for (const value of testCases) {
      // Arrange
      originalPort.setValue(value)

      // Act
      const serialized = superjson.stringify(originalPort)
      const deserialized = superjson.parse(serialized)

      // Assert
      expect(deserialized).toBeInstanceOf(ArrayPort)
      if (!(deserialized instanceof ArrayPort)) {
        continue
      }

      expect(deserialized.config).toEqual(originalPort.config)
      expect(deserialized.getValue()).toEqual(originalPort.getValue())
      expect(deserialized.config.elementConfig).toEqual(elementConfig)
    }
  })

  it('should preserve complex configuration after serialization', () => {
    // Arrange
    const config = {
      kind: PortKindEnum.Array,
      id: 'complex-array-port',
      direction: PortDirectionEnum.Output,
      optional: true,
      title: 'Complex Array Port',
      description: 'A test array port with complex configuration',
      metadata: {
        category: 'test',
        priority: 1,
      },
      elementConfig: {
        kind: PortKindEnum.String,
        id: 'string-element',
        title: 'String Element',
      } as StringPortConfig,
      defaultValue: ['default1', 'default2'],
    } as ArrayPortConfig<StringPortConfig>

    const originalPort = new ArrayPort(config)

    // Act
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(ArrayPort)
    if (!(deserialized instanceof ArrayPort)) {
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
    expect(deserialized.config.elementConfig).toEqual(config.elementConfig)
    expect(deserialized.getValue()).toEqual(config.defaultValue)
  })

  it('should handle empty array with complex element config', () => {
    // Arrange
    const elementConfig = {
      kind: PortKindEnum.String,
      id: 'complex-element',
      title: 'Complex Element',
      description: 'Element with full configuration',
      optional: true,
      metadata: {
        test: 'value',
      },
    } as StringPortConfig

    const originalPort = new ArrayPort({
      kind: PortKindEnum.Array,
      id: 'empty-array-port',
      elementConfig,
      defaultValue: [],
    })

    // Act
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(ArrayPort)
    if (!(deserialized instanceof ArrayPort)) {
      return
    }

    expect(deserialized.getValue()).toHaveLength(0)
    expect(deserialized.config.elementConfig).toEqual(elementConfig)
  })
})

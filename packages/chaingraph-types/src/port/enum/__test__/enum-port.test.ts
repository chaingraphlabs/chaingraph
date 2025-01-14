import type { EnumPortConfig, StringPortConfig } from '@chaingraph/types/port/types/port-config'
import { EnumPort, registerPortTransformers } from '@chaingraph/types'
import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'

describe('enumPort serialization', () => {
  beforeAll(() => {
    registerPortTransformers()
  })

  it('should correctly serialize and deserialize EnumPort with different option types', () => {
    // Arrange
    const options = [
      {
        kind: PortKindEnum.String,
        id: 'one',
        defaultValue: 'One',
      } as StringPortConfig,
      {
        kind: PortKindEnum.String,
        id: 'two',
        defaultValue: 'Two',
      } as StringPortConfig,
      {
        kind: PortKindEnum.String,
        id: 'three',
        defaultValue: 'Three',
      } as StringPortConfig,
    ]

    const originalPort = new EnumPort({
      kind: PortKindEnum.Enum,
      id: 'test-enum-port',
      direction: PortDirectionEnum.Input,
      options,
      defaultValue: null,
    })

    // Test selecting different options
    const testCases = [
      'one',
      'two',
      'three',
      null,
    ]

    for (const value of testCases) {
      // Arrange
      originalPort.setValue(value)

      // Act
      const serialized = superjson.stringify(originalPort)
      const deserialized = superjson.parse(serialized)

      // Assert
      expect(deserialized).toBeInstanceOf(EnumPort)
      if (!(deserialized instanceof EnumPort)) {
        continue
      }

      // Check basic properties
      expect(deserialized.config).toEqual(originalPort.config)
      expect(deserialized.getValue()).toEqual(originalPort.getValue())

      // Check options
      const originalOptions = originalPort.getOptions()
      const deserializedOptions = deserialized.getOptions()
      expect(deserializedOptions.length).toBe(originalOptions.length)

      // Check each option
      deserializedOptions.forEach((option, index) => {
        const originalOption = originalOptions[index]
        expect(option).toEqual(originalOption)
      })

      // Check selected option
      const originalSelected = originalPort.getSelectedOption()
      const deserializedSelected = deserialized.getSelectedOption()
      if (originalSelected === null) {
        expect(deserializedSelected).toBeNull()
      } else {
        expect(deserializedSelected).toEqual(originalSelected)
      }
    }
  })

  it('should preserve complex configuration after serialization', () => {
    // Arrange
    const config = {
      kind: PortKindEnum.Enum,
      id: 'complex-enum-port',
      direction: PortDirectionEnum.Output,
      optional: true,
      title: 'Complex Enum Port',
      description: 'A test enum port with complex configuration',
      metadata: {
        category: 'test',
        priority: 1,
      },
      options: [
        {
          kind: PortKindEnum.String,
          id: 'option-1',
          title: 'Option 1',
          defaultValue: 'value 1',
        } as StringPortConfig,
        {
          kind: PortKindEnum.String,
          id: 'option-2',
          title: 'Option 2',
          defaultValue: 'value 2',
        } as StringPortConfig,
      ],
      defaultValue: 'option-1',
    } as EnumPortConfig<StringPortConfig>

    const originalPort = new EnumPort(config)

    // Act
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(EnumPort)
    if (!(deserialized instanceof EnumPort)) {
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

    // Check options are preserved
    const options = deserialized.getOptions()
    expect(options.length).toBe(config.options.length)
    options.forEach((option, index) => {
      const configOption = config.options[index]
      expect(option).toEqual(configOption)
    })
  })

  it('should handle empty options array', () => {
    // Arrange
    const originalPort = new EnumPort({
      kind: PortKindEnum.Enum,
      id: 'empty-enum-port',
      options: [],
    })

    // Act
    const serialized = superjson.stringify(originalPort)
    const deserialized = superjson.parse(serialized)

    // Assert
    expect(deserialized).toBeInstanceOf(EnumPort)
    if (!(deserialized instanceof EnumPort)) {
      return
    }

    expect(deserialized.getOptions()).toHaveLength(0)
    expect(deserialized.getValue()).toBeNull()
  })
})

import { registerPortTransformers, StringPort } from '@chaingraph/types'
import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'
import superjson from 'superjson'
import { describe, expect, it } from 'vitest'

describe('stringPort serialization', () => {
  registerPortTransformers()

  it('should correctly serialize and deserialize StringPort with different value types', () => {
    // Arrange
    const originalPort = new StringPort({
      kind: PortKindEnum.String,
      id: 'test-string-port',
      direction: PortDirectionEnum.Input,
      defaultValue: 'default value',
    })

    // Test different string values
    const testCases = [
      // 'Simple string',
      // 'String with numbers 123',
      // 'String with special chars !@#$%^&*()',
      // 'Multi\nline\nstring',
      // 'Unicode string 你好世界',
      '', // empty string
      // '   String with spaces   ',
    ]

    for (const value of testCases) {
      // Arrange
      originalPort.setValue(value)

      // Act
      const serialized = superjson.stringify(originalPort)
      const deserialized = superjson.parse(serialized)

      // Assert
      expect(deserialized).toBeInstanceOf(StringPort)
      if (!(deserialized instanceof StringPort)) {
        continue
      }

      expect(deserialized.config).toEqual(originalPort.config)
      expect(deserialized.getValue()).toEqual(originalPort.getValue())
    }
  })
})

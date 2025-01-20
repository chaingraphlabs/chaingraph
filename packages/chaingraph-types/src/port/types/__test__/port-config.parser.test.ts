import type { PortConfig, StringPortConfig } from '@chaingraph/types'
import { registerPortTransformers } from '@chaingraph/types'
import {
  parsePortConfig,
  PortConfigParsingError,
} from '@chaingraph/types/port/types/port-config-parsing.zod'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import { PortKind } from '../port-kind'

describe('parsePortConfig', () => {
  beforeAll(() => {
    registerPortTransformers()
  })

  describe('simple port types', () => {
    it('should parse string port config', () => {
      const config = {
        kind: PortKind.String,
        defaultValue: 'test',
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKind.String)
    })

    it('should parse number port config', () => {
      const config = {
        kind: PortKind.Number,
        defaultValue: 42,
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKind.Number)
    })

    it('should parse boolean port config', () => {
      const config = {
        kind: PortKind.Boolean,
        defaultValue: true,
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKind.Boolean)
    })
  })

  describe('array port config', () => {
    it('should parse array port config with simple element type', () => {
      const config = {
        kind: PortKind.Array,
        elementConfig: {
          kind: PortKind.String,
        },
        defaultValue: ['test'],
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKind.Array)
      expect((result as any)?.elementConfig.kind).toBe(PortKind.String)
    })

    it('should parse nested array port config', () => {
      const config = {
        kind: PortKind.Array,
        elementConfig: {
          kind: PortKind.Array,
          elementConfig: {
            kind: PortKind.Number,
          },
        },
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect((result as any)?.elementConfig.kind).toBe(PortKind.Array)
      expect((result as any)?.elementConfig.elementConfig.kind).toBe(PortKind.Number)
    })
  })

  describe('object port config', () => {
    it('should parse object port config with simple properties', () => {
      const config = {
        kind: PortKind.Object,
        schema: {
          properties: {
            name: {
              kind: PortKind.String,
            },
            age: {
              kind: PortKind.Number,
            },
          },
        },
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKind.Object)
      expect((result as any)?.schema?.properties.name.kind).toBe(PortKind.String)
      expect((result as any)?.schema?.properties.age.kind).toBe(PortKind.Number)
    })

    it('should parse nested object port config', () => {
      const config = {
        kind: PortKind.Object,
        schema: {
          properties: {
            user: {
              kind: PortKind.Object,
              schema: {
                properties: {
                  name: {
                    kind: PortKind.String,
                  },
                },
              },
            },
          },
        },
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect((result as any)?.schema?.properties.user.kind).toBe(PortKind.Object)
      expect((result as any)?.schema?.properties.user.schema?.properties.name.kind).toBe(PortKind.String)
    })
  })

  describe('enum port config', () => {
    it('should parse enum port config', () => {
      const config = {
        kind: PortKind.Enum,
        options: [
          {
            kind: PortKind.String,
            id: 'option1',
          },
          {
            kind: PortKind.Number,
            id: 'option2',
          },
        ],
        defaultValue: 'option1',
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKind.Enum)
      expect((result as any)?.options).toHaveLength(2)
      expect((result as any)?.options[0].kind).toBe(PortKind.String)
      expect((result as any)?.options[1].kind).toBe(PortKind.Number)
    })
  })

  describe('any port config', () => {
    it('should parse any port config without connected config', () => {
      const config = {
        kind: PortKind.Any,
        defaultValue: 'anything',
      }

      const result = parsePortConfig(config)
      expect(result).toEqual({ ...config })
    })

    it('should parse any port config with connected config', () => {
      const config = {
        kind: PortKind.Any,
        connectedPortConfig: {
          kind: PortKind.String,
        },
      }

      const result = parsePortConfig(config)
      expect(result.kind).toBe(PortKind.Any)
      expect((result as any)?.connectedPortConfig?.kind).toBe(PortKind.String)
    })
  })

  describe('stream port configs', () => {
    it('should parse stream input port config', () => {
      const config = {
        kind: PortKind.StreamInput,
        valueType: {
          kind: PortKind.String,
        },
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKind.StreamInput)
      expect((result as any)?.valueType?.kind).toBe(PortKind.String)
    })

    it('should parse stream output port config', () => {
      const config = {
        kind: PortKind.StreamOutput,
        valueType: {
          kind: PortKind.Number,
        },
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKind.StreamOutput)
      expect((result as any)?.valueType?.kind).toBe(PortKind.Number)
    })
  })

  describe('error handling', () => {
    it('should throw PortConfigParsingError for invalid kind', () => {
      const config = {
        kind: 'invalid',
      }

      expect(() => parsePortConfig(config)).toThrow(PortConfigParsingError)
    })

    it('should throw PortConfigParsingError for missing kind', () => {
      const config = {
        defaultValue: 'test',
      }

      expect(() => parsePortConfig(config)).toThrow(PortConfigParsingError)
    })

    it('should include path in error for nested config', () => {
      const config = {
        kind: PortKind.Object,
        schema: {
          properties: {
            invalid: {
              kind: 'invalid',
            },
          },
        },
      }

      try {
        parsePortConfig(config)
        // fail('Should have thrown error')
      } catch (error: any) {
        expect(error).toBeInstanceOf(PortConfigParsingError)
        if (error instanceof PortConfigParsingError) {
          expect(error.path).toContain('schema')
          expect(error.path).toContain('properties')
          expect(error.path).toContain('invalid')
        }
      }
    })

    it('should validate required fields', () => {
      const config = {
        kind: PortKind.Array,
        // missing elementConfig
      }

      expect(() => parsePortConfig(config)).toThrow(PortConfigParsingError)
    })
  })

  describe('complex scenarios', () => {
    it('should parse complex nested configuration', () => {
      const config = {
        kind: PortKind.Object,
        schema: {
          properties: {
            items: {
              kind: PortKind.Array,
              elementConfig: {
                kind: PortKind.Object,
                schema: {
                  properties: {
                    name: {
                      kind: PortKind.String,
                    },
                    type: {
                      kind: PortKind.Enum,
                      options: [
                        {
                          kind: PortKind.String,
                          id: 'type1',
                        },
                        {
                          kind: PortKind.String,
                          id: 'type2',
                        },
                      ],
                    },
                  },
                },
              },
            },
            stream: {
              kind: PortKind.StreamInput,
              valueType: {
                kind: PortKind.Any,
                connectedPortConfig: {
                  kind: PortKind.Number,
                },
              },
            },
          },
        },
      }

      const result = parsePortConfig(config)
      expect(result).toBeDefined()
      expect(result.kind).toBe(PortKind.Object)
      expect((result as any)?.schema?.properties.items.kind).toBe(PortKind.Array)
      expect((result as any)?.schema?.properties.items.elementConfig.kind).toBe(PortKind.Object)
      expect((result as any)?.schema?.properties.stream.kind).toBe(PortKind.StreamInput)
      expect((result as any)?.schema?.properties.stream.valueType?.kind).toBe(PortKind.Any)
    })
  })

  describe('optional fields', () => {
    it('should parse config with optional fields', () => {
      const config = {
        kind: PortKind.String,
        id: 'test-id',
        title: 'Test Title',
        description: 'Test Description',
        optional: true,
        metadata: {
          custom: 'value',
        },
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.id).toBe('test-id')
      expect(result.title).toBe('Test Title')
      expect(result.description).toBe('Test Description')
      expect(result.optional).toBe(true)
      expect(result.metadata).toEqual({ custom: 'value' })
    })
  })

  describe('error handling and paths', () => {
    it('should include path in error for nested config', () => {
      const config = {
        kind: PortKind.Object,
        schema: {
          properties: {
            invalid: {
              kind: 'invalid',
            },
          },
        },
      }

      try {
        parsePortConfig(config)
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(PortConfigParsingError)
        if (error instanceof PortConfigParsingError) {
          expect(error.path).toEqual(['schema', 'properties', 'invalid', 'kind'])
        }
      }
    })

    it('should include path in error for array element config', () => {
      const config = {
        kind: PortKind.Array,
        elementConfig: {
          kind: 'invalid',
        },
      }

      try {
        parsePortConfig(config)
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(PortConfigParsingError)
        if (error instanceof PortConfigParsingError) {
          expect(error.path).toEqual(['elementConfig', 'kind'])
        }
      }
    })

    it('should include path in error for enum options', () => {
      const config = {
        kind: PortKind.Enum,
        options: [
          {
            kind: 'invalid',
          },
        ],
      }

      try {
        parsePortConfig(config)
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(PortConfigParsingError)
        if (error instanceof PortConfigParsingError) {
          expect(error.path).toEqual(['options', '0', 'kind'])
        }
      }
    })

    it('should handle multiple validation errors', () => {
      const config = {
        kind: PortKind.Object,
        schema: {
          properties: {
            field1: {
              kind: 'invalid1',
            },
            field2: {
              kind: 'invalid2',
            },
          },
        },
      }

      try {
        parsePortConfig(config)
        fail('Should have thrown error')
      } catch (error) {
        expect(error).toBeInstanceOf(PortConfigParsingError)
        if (error instanceof PortConfigParsingError) {
          expect(error.message).toContain('field1')
          expect(error.message).toContain('field2')
        }
      }
    })
  })

  // superjson serialize and deserialize config
  describe('superjson serialize and deserialize config', () => {
    it('should parse string port config', () => {
      const config: StringPortConfig = {
        kind: PortKind.String,
        defaultValue: 'test',
      }

      const configJson = superjson.stringify(config)
      const configDeserialized = superjson.parse<PortConfig>(configJson)

      const result = parsePortConfig(configDeserialized)
      expect(result).toEqual(configDeserialized)
      expect(result.kind).toBe(PortKind.String)

      // const result = parsePortConfig(config)
      expect(configDeserialized).toEqual(config)
      expect(configDeserialized.kind).toBe(PortKind.String)
    })

    it('should parse complex nested configuration', () => {
      const config = {
        kind: PortKind.Object,
        schema: {
          properties: {
            items: {
              kind: PortKind.Array,
              elementConfig: {
                kind: PortKind.Object,
                schema: {
                  properties: {
                    name: {
                      kind: PortKind.String,
                    },
                    type: {
                      kind: PortKind.Enum,
                      options: [
                        {
                          kind: PortKind.String,
                          id: 'type1',
                        },
                        {
                          kind: PortKind.String,
                          id: 'type2',
                        },
                      ],
                    },
                  },
                },
              },
            },
            stream: {
              kind: PortKind.StreamInput,
              valueType: {
                kind: PortKind.Any,
                connectedPortConfig: {
                  kind: PortKind.Number,
                },
              },
            },
          },
        },
      }

      const configJson = superjson.stringify(config)
      const configDeserialized = superjson.parse<PortConfig>(configJson)

      const result = parsePortConfig(configDeserialized)
      expect(result).toBeDefined()
      expect(result.kind).toBe(PortKind.Object)
      expect((result as any)?.schema?.properties.items.kind).toBe(PortKind.Array)
      expect((result as any)?.schema?.properties.items.elementConfig.kind).toBe(PortKind.Object)
      expect((result as any)?.schema?.properties.stream.kind).toBe(PortKind.StreamInput)
      expect((result as any)?.schema?.properties.stream.valueType?.kind).toBe(PortKind.Any)
    })
  })
})

function fail(arg0: string) {
  throw new Error(arg0)
}

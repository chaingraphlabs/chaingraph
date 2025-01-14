import type { PortConfig, StringPortConfig } from '@chaingraph/types'
import { registerPortTransformers } from '@chaingraph/types'
import {
  parsePortConfig,
  PortConfigParsingError,
} from '@chaingraph/types/port/types/port-config-parsing.zod'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import { PortKindEnum } from '../port-kind-enum'

describe('parsePortConfig', () => {
  beforeAll(() => {
    registerPortTransformers()
  })

  describe('simple port types', () => {
    it('should parse string port config', () => {
      const config = {
        kind: PortKindEnum.String,
        defaultValue: 'test',
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKindEnum.String)
    })

    it('should parse number port config', () => {
      const config = {
        kind: PortKindEnum.Number,
        defaultValue: 42,
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKindEnum.Number)
    })

    it('should parse boolean port config', () => {
      const config = {
        kind: PortKindEnum.Boolean,
        defaultValue: true,
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKindEnum.Boolean)
    })
  })

  describe('array port config', () => {
    it('should parse array port config with simple element type', () => {
      const config = {
        kind: PortKindEnum.Array,
        elementConfig: {
          kind: PortKindEnum.String,
        },
        defaultValue: ['test'],
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKindEnum.Array)
      expect((result as any)?.elementConfig.kind).toBe(PortKindEnum.String)
    })

    it('should parse nested array port config', () => {
      const config = {
        kind: PortKindEnum.Array,
        elementConfig: {
          kind: PortKindEnum.Array,
          elementConfig: {
            kind: PortKindEnum.Number,
          },
        },
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect((result as any)?.elementConfig.kind).toBe(PortKindEnum.Array)
      expect((result as any)?.elementConfig.elementConfig.kind).toBe(PortKindEnum.Number)
    })
  })

  describe('object port config', () => {
    it('should parse object port config with simple properties', () => {
      const config = {
        kind: PortKindEnum.Object,
        schema: {
          properties: {
            name: {
              kind: PortKindEnum.String,
            },
            age: {
              kind: PortKindEnum.Number,
            },
          },
        },
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKindEnum.Object)
      expect((result as any)?.schema?.properties.name.kind).toBe(PortKindEnum.String)
      expect((result as any)?.schema?.properties.age.kind).toBe(PortKindEnum.Number)
    })

    it('should parse nested object port config', () => {
      const config = {
        kind: PortKindEnum.Object,
        schema: {
          properties: {
            user: {
              kind: PortKindEnum.Object,
              schema: {
                properties: {
                  name: {
                    kind: PortKindEnum.String,
                  },
                },
              },
            },
          },
        },
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect((result as any)?.schema?.properties.user.kind).toBe(PortKindEnum.Object)
      expect((result as any)?.schema?.properties.user.schema?.properties.name.kind).toBe(PortKindEnum.String)
    })
  })

  describe('enum port config', () => {
    it('should parse enum port config', () => {
      const config = {
        kind: PortKindEnum.Enum,
        options: [
          {
            kind: PortKindEnum.String,
            id: 'option1',
          },
          {
            kind: PortKindEnum.Number,
            id: 'option2',
          },
        ],
        defaultValue: 'option1',
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKindEnum.Enum)
      expect((result as any)?.options).toHaveLength(2)
      expect((result as any)?.options[0].kind).toBe(PortKindEnum.String)
      expect((result as any)?.options[1].kind).toBe(PortKindEnum.Number)
    })
  })

  describe('any port config', () => {
    it('should parse any port config without connected config', () => {
      const config = {
        kind: PortKindEnum.Any,
        defaultValue: 'anything',
      }

      const result = parsePortConfig(config)
      expect(result).toEqual({ ...config })
    })

    it('should parse any port config with connected config', () => {
      const config = {
        kind: PortKindEnum.Any,
        connectedPortConfig: {
          kind: PortKindEnum.String,
        },
      }

      const result = parsePortConfig(config)
      expect(result.kind).toBe(PortKindEnum.Any)
      expect((result as any)?.connectedPortConfig?.kind).toBe(PortKindEnum.String)
    })
  })

  describe('stream port configs', () => {
    it('should parse stream input port config', () => {
      const config = {
        kind: PortKindEnum.StreamInput,
        valueType: {
          kind: PortKindEnum.String,
        },
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKindEnum.StreamInput)
      expect((result as any)?.valueType?.kind).toBe(PortKindEnum.String)
    })

    it('should parse stream output port config', () => {
      const config = {
        kind: PortKindEnum.StreamOutput,
        valueType: {
          kind: PortKindEnum.Number,
        },
      }

      const result = parsePortConfig(config)
      expect(result).toEqual(config)
      expect(result.kind).toBe(PortKindEnum.StreamOutput)
      expect((result as any)?.valueType?.kind).toBe(PortKindEnum.Number)
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
        kind: PortKindEnum.Object,
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
        kind: PortKindEnum.Array,
        // missing elementConfig
      }

      expect(() => parsePortConfig(config)).toThrow(PortConfigParsingError)
    })
  })

  describe('complex scenarios', () => {
    it('should parse complex nested configuration', () => {
      const config = {
        kind: PortKindEnum.Object,
        schema: {
          properties: {
            items: {
              kind: PortKindEnum.Array,
              elementConfig: {
                kind: PortKindEnum.Object,
                schema: {
                  properties: {
                    name: {
                      kind: PortKindEnum.String,
                    },
                    type: {
                      kind: PortKindEnum.Enum,
                      options: [
                        {
                          kind: PortKindEnum.String,
                          id: 'type1',
                        },
                        {
                          kind: PortKindEnum.String,
                          id: 'type2',
                        },
                      ],
                    },
                  },
                },
              },
            },
            stream: {
              kind: PortKindEnum.StreamInput,
              valueType: {
                kind: PortKindEnum.Any,
                connectedPortConfig: {
                  kind: PortKindEnum.Number,
                },
              },
            },
          },
        },
      }

      const result = parsePortConfig(config)
      expect(result).toBeDefined()
      expect(result.kind).toBe(PortKindEnum.Object)
      expect((result as any)?.schema?.properties.items.kind).toBe(PortKindEnum.Array)
      expect((result as any)?.schema?.properties.items.elementConfig.kind).toBe(PortKindEnum.Object)
      expect((result as any)?.schema?.properties.stream.kind).toBe(PortKindEnum.StreamInput)
      expect((result as any)?.schema?.properties.stream.valueType?.kind).toBe(PortKindEnum.Any)
    })
  })

  describe('optional fields', () => {
    it('should parse config with optional fields', () => {
      const config = {
        kind: PortKindEnum.String,
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
        kind: PortKindEnum.Object,
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
        kind: PortKindEnum.Array,
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
        kind: PortKindEnum.Enum,
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
        kind: PortKindEnum.Object,
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
        kind: PortKindEnum.String,
        defaultValue: 'test',
      }

      const configJson = superjson.stringify(config)
      const configDeserialized = superjson.parse<PortConfig>(configJson)

      const result = parsePortConfig(configDeserialized)
      expect(result).toEqual(configDeserialized)
      expect(result.kind).toBe(PortKindEnum.String)

      // const result = parsePortConfig(config)
      expect(configDeserialized).toEqual(config)
      expect(configDeserialized.kind).toBe(PortKindEnum.String)
    })

    it('should parse complex nested configuration', () => {
      const config = {
        kind: PortKindEnum.Object,
        schema: {
          properties: {
            items: {
              kind: PortKindEnum.Array,
              elementConfig: {
                kind: PortKindEnum.Object,
                schema: {
                  properties: {
                    name: {
                      kind: PortKindEnum.String,
                    },
                    type: {
                      kind: PortKindEnum.Enum,
                      options: [
                        {
                          kind: PortKindEnum.String,
                          id: 'type1',
                        },
                        {
                          kind: PortKindEnum.String,
                          id: 'type2',
                        },
                      ],
                    },
                  },
                },
              },
            },
            stream: {
              kind: PortKindEnum.StreamInput,
              valueType: {
                kind: PortKindEnum.Any,
                connectedPortConfig: {
                  kind: PortKindEnum.Number,
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
      expect(result.kind).toBe(PortKindEnum.Object)
      expect((result as any)?.schema?.properties.items.kind).toBe(PortKindEnum.Array)
      expect((result as any)?.schema?.properties.items.elementConfig.kind).toBe(PortKindEnum.Object)
      expect((result as any)?.schema?.properties.stream.kind).toBe(PortKindEnum.StreamInput)
      expect((result as any)?.schema?.properties.stream.valueType?.kind).toBe(PortKindEnum.Any)
    })
  })
})

function fail(arg0: string) {
  throw new Error(arg0)
}

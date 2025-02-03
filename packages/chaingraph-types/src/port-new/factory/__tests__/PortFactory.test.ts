import type {
  ArrayPortConfig,
  BooleanPortConfig,
  IPortConfig,
  NumberPortConfig,
  StringPortConfig,
} from '../../base/types'
import {
  createObjectPortConfig,
  createObjectSchema,
} from '@chaingraph/types/port-new/instances/ObjectPort'
import { describe, expect, it } from 'vitest'
import { PortFactory } from '../PortFactory'

describe('portFactory', () => {
  describe('create (typed) method', () => {
    it('should create a string port with proper configuration and default value', () => {
      const config: StringPortConfig = {
        type: 'string',
        minLength: 3,
        defaultValue: { type: 'string', value: 'default' },
      }
      const port = PortFactory.create(config)

      expect(port.getConfig()).toEqual(config)
      // Optionally, if the port automatically picks the default value
      expect(port.getValue()).toEqual({ type: 'string', value: 'default' })
    })

    it('should create a number port with proper configuration and default value', () => {
      const config: NumberPortConfig = {
        type: 'number',
        min: 0,
        max: 10,
        defaultValue: { type: 'number', value: 5 },
      }
      const port = PortFactory.create(config)
      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual({ type: 'number', value: 5 })
    })

    it('should create a boolean port with proper configuration and default value', () => {
      const config: BooleanPortConfig = {
        type: 'boolean',
        defaultValue: { type: 'boolean', value: true },
      }
      const port = PortFactory.create(config)
      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual({ type: 'boolean', value: true })
    })

    // You can add similar tests for array, object, and stream ports.
    // For brevity, here is an example for an array port.

    it('should create an array port with proper configuration', () => {
      const itemConfig: StringPortConfig = {
        type: 'string',
        minLength: 2,
      }
      const config: ArrayPortConfig<StringPortConfig> = {
        type: 'array',
        itemConfig,
        minLength: 1,
        maxLength: 3,
        defaultValue: {
          type: 'array',
          value: [{ type: 'string', value: 'item1' }],
        },
      }
      const port = PortFactory.create(config)

      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual({
        type: 'array',
        value: [{ type: 'string', value: 'item1' }],
      })
    })

    it('should create an object port with proper configuration', () => {
      const config = createObjectPortConfig({
        type: 'object',
        schema: createObjectSchema({
          name: { type: 'string', minLength: 2 },
          age: { type: 'number', min: 18 },
          address: createObjectPortConfig({
            type: 'object',
            schema: createObjectSchema({
              street: { type: 'string' },
              city: { type: 'string' },
            }),
          }),
        }),
        defaultValue: {
          type: 'object',
          value: {
            name: { type: 'string', value: 'John' },
            age: { type: 'number', value: 30 },
            address: {
              type: 'object',
              value: {
                street: { type: 'string', value: '123 Main St' },
                city: { type: 'string', value: 'Springfield' },
              },
            },
          },
        },
      })
      const port = PortFactory.create(config)

      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual({
        type: 'object',
        value: {
          name: { type: 'string', value: 'John' },
          age: { type: 'number', value: 30 },
          address: {
            type: 'object',
            value: {
              street: { type: 'string', value: '123 Main St' },
              city: { type: 'string', value: 'Springfield' },
            },
          },
        },
      })
    })

    it('should throw an error when an unsupported port type is provided', () => {
      const badConfig: IPortConfig = { type: 'unsupported', id: 'bad' } as any
      expect(() => PortFactory.create(badConfig)).toThrow()
    })
  })

  describe('createFromConfig (untyped) method', () => {
    it('should create a string port from a generic configuration', () => {
      const config: StringPortConfig = {
        type: 'string',
        minLength: 3,
        defaultValue: { type: 'string', value: 'hello' },
      }
      const port = PortFactory.createFromConfig(config)
      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual({ type: 'string', value: 'hello' })
    })

    it('should create a number port from a generic configuration', () => {
      const config: NumberPortConfig = {
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: { type: 'number', value: 42 },
      }
      const port = PortFactory.createFromConfig(config)
      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual({ type: 'number', value: 42 })
    })
  })

  describe('convenience methods', () => {
    it('should create a string port using createStringPort', () => {
      const config: StringPortConfig = {
        type: 'string',
        minLength: 4,
        defaultValue: { type: 'string', value: 'test' },
      }
      const port = PortFactory.createStringPort(config)

      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual({ type: 'string', value: 'test' })
    })

    it('should create a number port using createNumberPort', () => {
      const config: NumberPortConfig = {
        type: 'number',
        min: 1,
        max: 50,
        defaultValue: { type: 'number', value: 25 },
      }
      const port = PortFactory.createNumberPort(config)
      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual({ type: 'number', value: 25 })
    })

    // Similar tests can be added for createBooleanPort, createArrayPort,
    // createObjectPort, and createStreamPort as desired.
  })

  it('should create an object port using createObjectPort', () => {
    const config = createObjectPortConfig({
      type: 'object',
      schema: createObjectSchema({
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', min: 18 },
        address: createObjectPortConfig({
          type: 'object',
          schema: createObjectSchema({
            street: { type: 'string' },
            city: { type: 'string' },
          }),
        }),
      }),
      defaultValue: {
        type: 'object',
        value: {
          name: { type: 'string', value: 'John' },
          age: { type: 'number', value: 30 },
          address: {
            type: 'object',
            value: {
              street: { type: 'string', value: '123 Main St' },
              city: { type: 'string', value: 'Springfield' },
            },
          },
        },
      },
    })
    const port = PortFactory.createObjectPort(config)

    expect(port.getConfig()).toEqual(config)
    expect(port.getValue()).toEqual({
      type: 'object',
      value: {
        name: { type: 'string', value: 'John' },
        age: { type: 'number', value: 30 },
        address: {
          type: 'object',
          value: {
            street: { type: 'string', value: '123 Main St' },
            city: { type: 'string', value: 'Springfield' },
          },
        },
      },
    })
  })
})

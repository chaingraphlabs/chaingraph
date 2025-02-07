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
} from '@badaitech/chaingraph-types/port/instances/ObjectPort'
import { describe, expect, it } from 'vitest'
import { PortFactory } from '../PortFactory'

describe('portFactory', () => {
  describe('create (typed) method', () => {
    it('should create a string port with proper configuration and default value', () => {
      const config: StringPortConfig = {
        type: 'string',
        minLength: 3,
        defaultValue: 'default',
        ui: {
          bgColor: '#e70d0d',
          borderColor: '#460707',
        },
      }
      const port = PortFactory.create(config)

      expect(port.getConfig()).toEqual(config)
      // Optionally, if the port automatically picks the default value
      expect(port.getValue()).toEqual('default')
    })

    it('should create a number port with proper configuration and default value', () => {
      const config: NumberPortConfig = {
        type: 'number',
        min: 0,
        max: 10,
        defaultValue: 5,
        ui: {
          bgColor: '#1f5eec',
          borderColor: '#0c2454',
        },
      }
      const port = PortFactory.create(config)
      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual(5)
    })

    it('should create a boolean port with proper configuration and default value', () => {
      const config: BooleanPortConfig = {
        type: 'boolean',
        defaultValue: true,
        ui: {
          bgColor: '#63f54d',
          borderColor: '#1e4b18',
        },
      }
      const port = PortFactory.create(config)
      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual(true)
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
        defaultValue: ['item1'],
        ui: {
          bgColor: '#63f54d',
          borderColor: '#1e4b18',
        },
      }
      const port = PortFactory.create(config)

      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual(['item1'])
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
          name: 'John',
          age: 30,
          address: {
            street: '123 Main St',
            city: 'Springfield',
          },
        },
        ui: {
          bgColor: '#63f54d',
          borderColor: '#1e4b18',
        },
      })
      const port = PortFactory.create(config)

      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual({
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'Springfield',
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
        defaultValue: 'hello',
        ui: {
          bgColor: '#e70d0d',
          borderColor: '#460707',
        },
      }
      const port = PortFactory.createFromConfig(config)
      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual('hello')
    })

    it('should create a number port from a generic configuration', () => {
      const config: NumberPortConfig = {
        type: 'number',
        min: 0,
        max: 100,
        defaultValue: 42,
        ui: {
          bgColor: '#1f5eec',
          borderColor: '#0c2454',
        },
      }
      const port = PortFactory.createFromConfig(config)
      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual(42)
    })
  })

  describe('convenience methods', () => {
    it('should create a string port using createStringPort', () => {
      const config: StringPortConfig = {
        type: 'string',
        minLength: 4,
        defaultValue: 'test',
        ui: {
          bgColor: '#e70d0d',
          borderColor: '#460707',
        },
      }
      const port = PortFactory.createStringPort(config)

      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual('test')
    })

    it('should create a number port using createNumberPort', () => {
      const config: NumberPortConfig = {
        type: 'number',
        min: 1,
        max: 50,
        defaultValue: 25,
        ui: {
          bgColor: '#1f5eec',
          borderColor: '#0c2454',
        },
      }
      const port = PortFactory.createNumberPort(config)
      expect(port.getConfig()).toEqual(config)
      expect(port.getValue()).toEqual(25)
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
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'Springfield',
        },
      },
      ui: {
        bgColor: '#63f54d',
        borderColor: '#1e4b18',
      },
    })
    const port = PortFactory.createObjectPort(config)

    expect(port.getConfig()).toEqual(config)
    expect(port.getValue()).toEqual({
      name: 'John',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Springfield',
      },
    })
  })
})

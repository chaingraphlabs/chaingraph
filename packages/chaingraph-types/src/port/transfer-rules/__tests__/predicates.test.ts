/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AnyPortConfig, ArrayPortConfig, IPortConfig, ObjectPortConfig } from '../../base'
import { describe, expect, it } from 'vitest'
import { undefined } from 'zod'
import { Predicates } from '../predicates'

describe('predicates', () => {
  describe('basic Type Predicates', () => {
    it('should identify object ports', () => {
      const objectPort: IPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        schema: { properties: {} },
      }
      const stringPort: IPortConfig = {
        id: 'test',
        type: 'string',
        direction: 'input',
      }

      expect(Predicates.isObject(objectPort)).toBe(true)
      expect(Predicates.isObject(stringPort)).toBe(false)
    })

    it('should identify array ports', () => {
      const arrayPort: IPortConfig = {
        id: 'test',
        type: 'array',
        direction: 'input',
        itemConfig: { type: 'any' },
      }
      const objectPort: IPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        schema: { properties: {} },
      }

      expect(Predicates.isArray(arrayPort)).toBe(true)
      expect(Predicates.isArray(objectPort)).toBe(false)
    })

    it('should identify any ports', () => {
      const anyPort: IPortConfig = {
        id: 'test',
        type: 'any',
        direction: 'input',
      }
      const stringPort: IPortConfig = {
        id: 'test',
        type: 'string',
        direction: 'input',
      }

      expect(Predicates.isAny(anyPort)).toBe(true)
      expect(Predicates.isAny(stringPort)).toBe(false)
    })

    it('should identify simple types', () => {
      const stringPort: IPortConfig = {
        id: 'test',
        type: 'string',
        direction: 'input',
      }
      const numberPort: IPortConfig = {
        id: 'test',
        type: 'number',
        direction: 'input',
      }
      const booleanPort: IPortConfig = {
        id: 'test',
        type: 'boolean',
        direction: 'input',
      }

      expect(Predicates.isString(stringPort)).toBe(true)
      expect(Predicates.isNumber(numberPort)).toBe(true)
      expect(Predicates.isBoolean(booleanPort)).toBe(true)

      expect(Predicates.isString(numberPort)).toBe(false)
      expect(Predicates.isNumber(booleanPort)).toBe(false)
      expect(Predicates.isBoolean(stringPort)).toBe(false)
    })

    it('should create type predicates with isType', () => {
      const stringPredicate = Predicates.isType('string')
      const numberPredicate = Predicates.isType('number')

      const stringPort: IPortConfig = {
        id: 'test',
        type: 'string',
        direction: 'input',
      }
      const numberPort: IPortConfig = {
        id: 'test',
        type: 'number',
        direction: 'input',
      }

      expect(stringPredicate(stringPort)).toBe(true)
      expect(stringPredicate(numberPort)).toBe(false)
      expect(numberPredicate(numberPort)).toBe(true)
      expect(numberPredicate(stringPort)).toBe(false)
    })
  })

  describe('object-Specific Predicates', () => {
    it('should identify mutable object ports', () => {
      const mutableObject: ObjectPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        isSchemaMutable: true,
        schema: { properties: {} },
      }
      const immutableObject: ObjectPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        isSchemaMutable: false,
        schema: { properties: {} },
      }
      const notObject: IPortConfig = {
        id: 'test',
        type: 'string',
        direction: 'input',
      }

      expect(Predicates.isMutableObject(mutableObject)).toBe(true)
      expect(Predicates.isMutableObject(immutableObject)).toBe(false)
      expect(Predicates.isMutableObject(notObject)).toBe(false)
    })

    it('should identify immutable object ports', () => {
      const immutableObject: ObjectPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        isSchemaMutable: false,
        schema: { properties: {} },
      }
      const defaultObject: ObjectPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        schema: { properties: {} },
      }
      const mutableObject: ObjectPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        isSchemaMutable: true,
        schema: { properties: {} },
      }

      expect(Predicates.isImmutableObject(immutableObject)).toBe(true)
      expect(Predicates.isImmutableObject(defaultObject)).toBe(true)
      expect(Predicates.isImmutableObject(mutableObject)).toBe(false)
    })

    it('should identify empty schemas', () => {
      const emptySchema: ObjectPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        schema: { properties: {} },
      }
      const nonEmptySchema: ObjectPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        schema: {
          properties: {
            field: { type: 'string', direction: 'input', id: 'field' },
          },
        },
      }
      const noSchema: ObjectPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        schema: { properties: {} },
      }

      expect(Predicates.hasEmptySchema(emptySchema)).toBe(true)
      expect(Predicates.hasEmptySchema(noSchema)).toBe(true)
      expect(Predicates.hasEmptySchema(nonEmptySchema)).toBe(false)
    })

    it('should check for specific properties', () => {
      const withProperty: ObjectPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        schema: {
          properties: {
            name: { type: 'string', direction: 'input', id: 'name' },
            age: { type: 'number', direction: 'input', id: 'age' },
          },
        },
      }

      const hasName = Predicates.hasProperty('name')
      const hasAge = Predicates.hasProperty('age')
      const hasEmail = Predicates.hasProperty('email')

      expect(hasName(withProperty)).toBe(true)
      expect(hasAge(withProperty)).toBe(true)
      expect(hasEmail(withProperty)).toBe(false)
    })
  })

  describe('any Port Predicates', () => {
    it('should identify any ports with underlying type', () => {
      const withUnderlying: AnyPortConfig = {
        id: 'test',
        type: 'any',
        direction: 'input',
        underlyingType: {
          type: 'string',
          direction: 'input',
          id: 'underlying',
        },
      }
      const withoutUnderlying: AnyPortConfig = {
        id: 'test',
        type: 'any',
        direction: 'input',
      }

      expect(Predicates.hasUnderlyingType(withUnderlying)).toBe(true)
      expect(Predicates.hasUnderlyingType(withoutUnderlying)).toBe(false)
      expect(Predicates.hasNoUnderlyingType(withoutUnderlying)).toBe(true)
      expect(Predicates.hasNoUnderlyingType(withUnderlying)).toBe(false)
    })

    it('should identify any ports with underlying object', () => {
      const withObjectUnderlying: AnyPortConfig = {
        id: 'test',
        type: 'any',
        direction: 'input',
        underlyingType: {
          type: 'object',
          direction: 'input',
          id: 'underlying',
          schema: { properties: {} },
        },
      }
      const withStringUnderlying: AnyPortConfig = {
        id: 'test',
        type: 'any',
        direction: 'input',
        underlyingType: {
          type: 'string',
          direction: 'input',
          id: 'underlying',
        },
      }

      expect(Predicates.hasUnderlyingObject(withObjectUnderlying)).toBe(true)
      expect(Predicates.hasUnderlyingObject(withStringUnderlying)).toBe(false)
    })

    it('should identify any ports with underlying array', () => {
      const withArrayUnderlying: AnyPortConfig = {
        id: 'test',
        type: 'any',
        direction: 'input',
        underlyingType: {
          type: 'array',
          direction: 'input',
          id: 'underlying',
          itemConfig: { type: 'any' },
        },
      }
      const withObjectUnderlying: AnyPortConfig = {
        id: 'test',
        type: 'any',
        direction: 'input',
        underlyingType: {
          type: 'object',
          direction: 'input',
          id: 'underlying',
          schema: { properties: {} },
        },
      }

      expect(Predicates.hasUnderlyingArray(withArrayUnderlying)).toBe(true)
      expect(Predicates.hasUnderlyingArray(withObjectUnderlying)).toBe(false)
    })

    it('should handle nested any ports', () => {
      const nestedAny: AnyPortConfig = {
        id: 'test',
        type: 'any',
        direction: 'input',
        underlyingType: {
          type: 'any',
          direction: 'input',
          id: 'nested1',
          underlyingType: {
            type: 'object',
            direction: 'input',
            id: 'nested2',
            schema: { properties: {} },
          },
        },
      }

      expect(Predicates.hasUnderlyingType(nestedAny)).toBe(true)
      expect(Predicates.hasUnderlyingObject(nestedAny)).toBe(true)
    })

    it('should check for specific underlying types', () => {
      const hasUnderlyingString = Predicates.hasUnderlyingType_('string')
      const hasUnderlyingNumber = Predicates.hasUnderlyingType_('number')

      const stringUnderlying: AnyPortConfig = {
        id: 'test',
        type: 'any',
        direction: 'input',
        underlyingType: {
          type: 'string',
          direction: 'input',
          id: 'underlying',
        },
      }
      const numberUnderlying: AnyPortConfig = {
        id: 'test',
        type: 'any',
        direction: 'input',
        underlyingType: {
          type: 'number',
          direction: 'input',
          id: 'underlying',
        },
      }

      expect(hasUnderlyingString(stringUnderlying)).toBe(true)
      expect(hasUnderlyingString(numberUnderlying)).toBe(false)
      expect(hasUnderlyingNumber(numberUnderlying)).toBe(true)
      expect(hasUnderlyingNumber(stringUnderlying)).toBe(false)
    })
  })

  describe('array-Specific Predicates', () => {
    it('should identify arrays with any item type', () => {
      const anyItemArray: ArrayPortConfig = {
        id: 'test',
        type: 'array',
        direction: 'input',
        itemConfig: {
          type: 'any',
          direction: 'input',
          id: 'item',
        },
      }
      const noItemArray: ArrayPortConfig = {
        id: 'test',
        type: 'array',
        direction: 'input',
        itemConfig: { type: 'any' },
      }
      const stringItemArray: ArrayPortConfig = {
        id: 'test',
        type: 'array',
        direction: 'input',
        itemConfig: {
          type: 'string',
          direction: 'input',
          id: 'item',
        },
      }

      expect(Predicates.hasAnyItemType(anyItemArray)).toBe(true)
      expect(Predicates.hasAnyItemType(noItemArray)).toBe(true)
      expect(Predicates.hasAnyItemType(stringItemArray)).toBe(false)
    })

    it('should check for specific item types', () => {
      const hasStringItems = Predicates.hasItemType('string')
      const hasNumberItems = Predicates.hasItemType('number')

      const stringArray: ArrayPortConfig = {
        id: 'test',
        type: 'array',
        direction: 'input',
        itemConfig: {
          type: 'string',
          direction: 'input',
          id: 'item',
        },
      }
      const numberArray: ArrayPortConfig = {
        id: 'test',
        type: 'array',
        direction: 'input',
        itemConfig: {
          type: 'number',
          direction: 'input',
          id: 'item',
        },
      }

      expect(hasStringItems(stringArray)).toBe(true)
      expect(hasStringItems(numberArray)).toBe(false)
      expect(hasNumberItems(numberArray)).toBe(true)
      expect(hasNumberItems(stringArray)).toBe(false)
    })

    it('should identify arrays with no item config', () => {
      const noConfig: ArrayPortConfig = {
        id: 'test',
        type: 'array',
        direction: 'input',
        // itemConfig: { type: 'any' },
        itemConfig: undefined as any,
      }
      const withConfig: ArrayPortConfig = {
        id: 'test',
        type: 'array',
        direction: 'input',
        itemConfig: {
          type: 'string',
          direction: 'input',
          id: 'item',
        },
      }

      expect(Predicates.hasNoItemConfig(noConfig)).toBe(true)
      expect(Predicates.hasNoItemConfig(withConfig)).toBe(false)
    })
  })

  describe('logical Combinators', () => {
    it('should combine predicates with AND', () => {
      const isObjectAndMutable = Predicates.and(
        Predicates.isObject,
        Predicates.isMutableObject,
      )

      const mutableObject: ObjectPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        isSchemaMutable: true,
        schema: { properties: {} },
      }
      const immutableObject: ObjectPortConfig = {
        id: 'test',
        type: 'object',
        direction: 'input',
        isSchemaMutable: false,
        schema: { properties: {} },
      }
      const notObject: IPortConfig = {
        id: 'test',
        type: 'string',
        direction: 'input',
      }

      expect(isObjectAndMutable(mutableObject)).toBe(true)
      expect(isObjectAndMutable(immutableObject)).toBe(false)
      expect(isObjectAndMutable(notObject)).toBe(false)
    })

    it('should combine predicates with OR', () => {
      const isStringOrNumber = Predicates.or(
        Predicates.isString,
        Predicates.isNumber,
      )

      const stringPort: IPortConfig = {
        id: 'test',
        type: 'string',
        direction: 'input',
      }
      const numberPort: IPortConfig = {
        id: 'test',
        type: 'number',
        direction: 'input',
      }
      const booleanPort: IPortConfig = {
        id: 'test',
        type: 'boolean',
        direction: 'input',
      }

      expect(isStringOrNumber(stringPort)).toBe(true)
      expect(isStringOrNumber(numberPort)).toBe(true)
      expect(isStringOrNumber(booleanPort)).toBe(false)
    })

    it('should negate predicates', () => {
      const notString = Predicates.not(Predicates.isString)

      const stringPort: IPortConfig = {
        id: 'test',
        type: 'string',
        direction: 'input',
      }
      const numberPort: IPortConfig = {
        id: 'test',
        type: 'number',
        direction: 'input',
      }

      expect(notString(stringPort)).toBe(false)
      expect(notString(numberPort)).toBe(true)
    })

    it('should handle complex combinations', () => {
      const complexPredicate = Predicates.and(
        Predicates.isArray,
        Predicates.or(
          Predicates.hasAnyItemType,
          Predicates.hasItemType('string'),
        ),
      )

      const anyItemArray: ArrayPortConfig = {
        id: 'test',
        type: 'array',
        direction: 'input',
        itemConfig: {
          type: 'any',
          direction: 'input',
          id: 'item',
        },
      }
      const stringItemArray: ArrayPortConfig = {
        id: 'test',
        type: 'array',
        direction: 'input',
        itemConfig: {
          type: 'string',
          direction: 'input',
          id: 'item',
        },
      }
      const numberItemArray: ArrayPortConfig = {
        id: 'test',
        type: 'array',
        direction: 'input',
        itemConfig: {
          type: 'number',
          direction: 'input',
          id: 'item',
        },
      }

      expect(complexPredicate(anyItemArray)).toBe(true)
      expect(complexPredicate(stringItemArray)).toBe(true)
      expect(complexPredicate(numberItemArray)).toBe(false)
    })

    it('should handle always and never predicates', () => {
      const port: IPortConfig = {
        id: 'test',
        type: 'string',
        direction: 'input',
      }

      expect(Predicates.always()).toBe(true)
      expect(Predicates.never()).toBe(false)

      const alwaysPredicate = Predicates.or(
        Predicates.isString,
        () => Predicates.always(),
      )
      const neverPredicate = Predicates.and(
        Predicates.isString,
        () => Predicates.never(),
      )

      expect(alwaysPredicate(port)).toBe(true)
      expect(neverPredicate(port)).toBe(false)
    })
  })
})

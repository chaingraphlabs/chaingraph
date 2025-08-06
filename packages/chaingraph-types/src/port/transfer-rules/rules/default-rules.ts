/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TransferRule } from '../types'
import { TransferEngine } from '../engine'
import { Predicates } from '../predicates'
import { Strategies } from '../strategies'

const {
  isObject,
  isMutableObject,
  isImmutableObject,
  isAny,
  hasUnderlyingObject,
  hasUnderlyingArray,
  hasUnderlyingType,
  isArray,
  hasAnyItemType,
  hasNoItemConfig,
  canReceiveSchema,
  isSchemaCompatible,
  and,
  or,
  not,
} = Predicates

const {
  value,
  objectSchemaAndValue,
  arrayConfigAndValue,
  underlyingTypeAndValue,
  compose,
  when,
} = Strategies

/**
 * Default transfer rules for common port connections
 */
export const defaultTransferRules: TransferRule[] = [
  // ============================================
  // Object Transfer Rules
  // ============================================

  // object{WithSchema} -> object{mutable,empty}
  // Mutable objects with empty schemas can receive any object schema
  TransferEngine.rule('object-to-mutable-empty-object')
    .from(isObject)
    .to(and(isMutableObject, Predicates.hasEmptySchema))
    .transfer(objectSchemaAndValue)
    .withPriority(110)
    .withDescription('Transfer schema and value to mutable object with empty schema')
    .build(),

  // object{WithSchema} -> object{mutable,withSchema}
  // Mutable objects with existing schemas need compatibility check
  TransferEngine.rule('object-to-mutable-object')
    .from(isObject)
    .to(and(isMutableObject, not(Predicates.hasEmptySchema)))
    .validate((source, target) => Predicates.hasCompatibleSchemas(source, target))
    .transfer(objectSchemaAndValue)
    .withPriority(100)
    .withDescription('Transfer schema and value to mutable object with compatible schema')
    .build(),

  // object -> object{not mutable}
  // Immutable objects need strict schema compatibility
  TransferEngine.rule('object-to-immutable-object')
    .from(isObject)
    .to(isImmutableObject)
    .validate((source, target) => Predicates.hasCompatibleSchemas(source, target))
    .transfer(value)
    .withPriority(90)
    .withDescription('Transfer only value to immutable object with compatible schema')
    .build(),

  // ============================================
  // Any Port with Underlying Type Rules
  // ============================================

  // any{underlying:object} -> object{mutable,empty}
  // Unwrap source and transfer schema+value to empty mutable object
  TransferEngine.rule('any-object-to-mutable-empty-object')
    .from(hasUnderlyingObject)
    .to(and(isMutableObject, Predicates.hasEmptySchema))
    .transfer(objectSchemaAndValue)
    .withPriority(105)
    .withDescription('Unwrap any port with object and transfer to empty mutable object')
    .build(),

  // any{underlying:object} -> object{mutable,withSchema}
  // Unwrap source and check compatibility before transfer
  TransferEngine.rule('any-object-to-mutable-object')
    .from(hasUnderlyingObject)
    .to(and(isMutableObject, not(Predicates.hasEmptySchema)))
    .validate((source, target) => Predicates.hasCompatibleSchemas(source, target))
    .transfer(objectSchemaAndValue)
    .withPriority(95)
    .withDescription('Unwrap any port with object and transfer to compatible mutable object')
    .build(),

  // any{underlying:object} -> object{immutable}
  // Unwrap source and transfer only value to immutable object with compatibility check
  TransferEngine.rule('any-object-to-immutable-object')
    .from(hasUnderlyingObject)
    .to(isImmutableObject)
    .validate((source, target) => Predicates.hasCompatibleSchemas(source, target))
    .transfer(value)
    .withPriority(85)
    .withDescription('Unwrap any port with object and transfer value to compatible immutable object')
    .build(),

  // any{underlying:type} -> any
  // Set underlying type on target any port
  TransferEngine.rule('any-with-type-to-any')
    .from(hasUnderlyingType)
    .to(isAny)
    .transfer(underlyingTypeAndValue)
    .withPriority(80)
    .withDescription('Transfer underlying type and value between any ports')
    .build(),

  // ============================================
  // Type to Any Port Rules
  // ============================================

  // object -> any
  // Set object as underlying type on any port
  TransferEngine.rule('object-to-any')
    .from(isObject)
    .to(isAny)
    .transfer(underlyingTypeAndValue)
    .withPriority(70)
    .withDescription('Set object as underlying type on any port')
    .build(),

  // array -> any
  TransferEngine.rule('array-to-any')
    .from(isArray)
    .to(isAny)
    .transfer(underlyingTypeAndValue)
    .withPriority(65)
    .withDescription('Set array as underlying type on any port')
    .build(),

  // ============================================
  // Array Transfer Rules
  // ============================================

  // array -> array{any items or no config}
  // Transfer item configuration when target has flexible items
  TransferEngine.rule('array-config-transfer')
    .from(isArray)
    .to(and(isArray, or(hasAnyItemType, hasNoItemConfig)))
    .transfer(arrayConfigAndValue)
    .withPriority(60)
    .withDescription('Transfer array item configuration and value')
    .build(),

  // array -> array{specific items}
  // Only transfer value when target has specific item config
  TransferEngine.rule('array-value-only')
    .from(isArray)
    .to(and(isArray, not(hasAnyItemType), not(hasNoItemConfig)))
    .transfer(value)
    .withPriority(55)
    .withDescription('Transfer only array value when target has specific item config')
    .build(),

  // any{underlying:array} -> array{flexible}
  TransferEngine.rule('any-array-to-array-flexible')
    .from(hasUnderlyingArray)
    .to(and(isArray, or(hasAnyItemType, hasNoItemConfig)))
    .transfer(arrayConfigAndValue)
    .withPriority(58)
    .withDescription('Unwrap any port with array and transfer to flexible array')
    .build(),

  // ============================================
  // Simple Type Rules
  // ============================================

  // string -> string
  TransferEngine.rule('string-to-string')
    .from(Predicates.isString)
    .to(Predicates.isString)
    .transfer(value)
    .withPriority(40)
    .withDescription('Transfer string value')
    .build(),

  // number -> number
  TransferEngine.rule('number-to-number')
    .from(Predicates.isNumber)
    .to(Predicates.isNumber)
    .transfer(value)
    .withPriority(40)
    .withDescription('Transfer number value')
    .build(),

  // boolean -> boolean
  TransferEngine.rule('boolean-to-boolean')
    .from(Predicates.isBoolean)
    .to(Predicates.isBoolean)
    .transfer(value)
    .withPriority(40)
    .withDescription('Transfer boolean value')
    .build(),

  // simple type -> any
  TransferEngine.rule('simple-type-to-any')
    .from(or(Predicates.isString, Predicates.isNumber, Predicates.isBoolean))
    .to(isAny)
    .transfer(underlyingTypeAndValue)
    .withPriority(35)
    .withDescription('Set simple type as underlying on any port')
    .build(),

  // ============================================
  // Fallback Rules
  // ============================================

  // any -> any (without underlying type)
  TransferEngine.rule('any-to-any-fallback')
    .from(and(isAny, not(hasUnderlyingType)))
    .to(isAny)
    .transfer(value)
    .withPriority(20)
    .withDescription('Transfer value between any ports without underlying type')
    .build(),

  // Same type fallback (catch-all for matching types)
  // TransferEngine.rule('same-type-fallback')
  //   .from(Predicates.always)
  //   .to(Predicates.always)
  //   .transfer(when(
  //     ctx => ctx.sourceConfig.type === ctx.targetConfig.type,
  //     value,
  //     Strategies.noop,
  //   ))
  //   .withPriority(10)
  //   .withDescription('Transfer value between ports of the same type')
  //   .build(),
]

/**
 * Create a transfer engine with default rules
 */
export function createDefaultTransferEngine(): TransferEngine {
  return new TransferEngine(defaultTransferRules)
}

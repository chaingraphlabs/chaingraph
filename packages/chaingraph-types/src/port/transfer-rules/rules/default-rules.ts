/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ObjectPortConfig } from '../../base'
import type { TransferRule } from '../types'
import { TransferEngine } from '../engine'
import { Predicates } from '../predicates'
import { Strategies } from '../strategies'
import { isEmptyObjectSchema } from '../utils/schema-compatibility'

const {
  isObject,
  isAny,
  hasUnderlyingObject,
  hasUnderlyingArray,
  hasUnderlyingType,
  isArray,
  isMutableArray,
  hasAnyItemType,
  hasNoItemConfig,
  hasCompatibleArrayItems,
  hasCompatibleSchemas,
  isString,
  isNumber,
  isBoolean,
  isEnum,
  hasUnderlyingEnum,
  isSecret,
  isStream,
  hasCompatibleSecretTypes,
  hasUnderlyingSecret,
  hasUnderlyingStream,
  isMutableStream,
  hasAnyStreamItemType,
  hasNoStreamItemConfig,
  hasCompatibleStreamItems,
  and,
  or,
  not,
} = Predicates

const {
  value,
  objectSchemaAndValue,
  arrayConfigAndValue,
  streamConfigAndValue,
  underlyingTypeAndValue,
} = Strategies

/**
 * Default transfer rules for common port connections
 */
export const defaultTransferRules: TransferRule[] = [
  // ============================================
  // Object Transfer Rule (single rule for all object connections)
  // ============================================
  TransferEngine.rule('object-to-object')
    .from(isObject)
    .to(isObject)
    .behaviors({
      canConnect: (source, target) => {
        const targetObj = target as ObjectPortConfig

        // Mutable empty can accept anything
        if (targetObj.isSchemaMutable && isEmptyObjectSchema(target)) {
          return true
        }

        // Otherwise check compatibility
        return hasCompatibleSchemas(source, target)
      },

      onConnect: (ctx) => {
        const targetObj = ctx.targetConfig as ObjectPortConfig

        // Mutable: transfer schema and value
        if (targetObj.isSchemaMutable) {
          return objectSchemaAndValue(ctx)
        }

        // Immutable: only value
        return value(ctx)
      },

      onSourceUpdate: (ctx) => {
        const targetObj = ctx.targetConfig as ObjectPortConfig

        // Mutable: ALWAYS sync schema and value (even if incompatible)
        if (targetObj.isSchemaMutable) {
          return objectSchemaAndValue(ctx)
        }

        // Immutable: only sync if compatible
        if (hasCompatibleSchemas(ctx.sourceConfig, ctx.targetConfig)) {
          return value(ctx)
        }

        return {
          success: false,
          message: 'Immutable target incompatible with source changes',
        }
      },
    })
    .withPriority(100)
    .withDescription('Handle all object to object connections')
    .build(),

  // ============================================
  // Any Port with Underlying Object Rule
  // ============================================
  TransferEngine.rule('any-with-object-to-object')
    .from(hasUnderlyingObject)
    .to(isObject)
    .behaviors({
      canConnect: (source, target) => {
        const targetObj = target as ObjectPortConfig

        // Mutable empty can accept anything
        if (targetObj.isSchemaMutable && isEmptyObjectSchema(target)) {
          return true
        }

        // Otherwise check compatibility
        return hasCompatibleSchemas(source, target)
      },

      onConnect: (ctx) => {
        const targetObj = ctx.targetConfig as ObjectPortConfig

        // Mutable: transfer schema and value
        if (targetObj.isSchemaMutable) {
          return objectSchemaAndValue(ctx)
        }

        // Immutable: only value
        return value(ctx)
      },

      onSourceUpdate: (ctx) => {
        const targetObj = ctx.targetConfig as ObjectPortConfig

        // Mutable: ALWAYS sync
        if (targetObj.isSchemaMutable) {
          return objectSchemaAndValue(ctx)
        }

        // Immutable: only sync if compatible
        if (hasCompatibleSchemas(ctx.sourceConfig, ctx.targetConfig)) {
          return value(ctx)
        }

        return {
          success: false,
          message: 'Immutable target incompatible with source changes',
        }
      },
    })
    .withPriority(95)
    .withDescription('Handle any port with underlying object to object connections')
    .build(),

  // ============================================
  // Object/Array to Any Port Rules
  // ============================================
  TransferEngine.rule('object-to-any')
    .from(isObject)
    .to(isAny)
    .behaviors({
      onConnect: underlyingTypeAndValue,
      onSourceUpdate: underlyingTypeAndValue,
    })
    .withPriority(70)
    .withDescription('Set object as underlying type on any port')
    .build(),

  TransferEngine.rule('array-to-any')
    .from(isArray)
    .to(isAny)
    .behaviors({
      onConnect: underlyingTypeAndValue,
      onSourceUpdate: underlyingTypeAndValue,
    })
    .withPriority(65)
    .withDescription('Set array as underlying type on any port')
    .build(),

  // ============================================
  // Any to Any Rules
  // ============================================
  TransferEngine.rule('any-with-type-to-any')
    .from(hasUnderlyingType)
    .to(isAny)
    .behaviors({
      onConnect: underlyingTypeAndValue,
      onSourceUpdate: underlyingTypeAndValue,
    })
    .withPriority(80)
    .withDescription('Transfer underlying type and value between any ports')
    .build(),

  TransferEngine.rule('any-to-any-fallback')
    .from(and(isAny, not(hasUnderlyingType)))
    .to(isAny)
    .behaviors({
      onConnect: value,
      onSourceUpdate: value,
    })
    .withPriority(20)
    .withDescription('Transfer value between any ports without underlying type')
    .build(),

  // ============================================
  // Array Transfer Rule
  // ============================================
  TransferEngine.rule('array-to-array')
    .from(isArray)
    .to(isArray)
    .behaviors({
      canConnect: (source, target) => {
        // If target is mutable, always allow connection
        if (isMutableArray(target)) {
          return true
        }

        // If target accepts any items or has no config, allow
        if (or(hasAnyItemType, hasNoItemConfig)(target)) {
          return true
        }

        // Otherwise check item type compatibility recursively
        return hasCompatibleArrayItems(source, target)
      },

      onConnect: (ctx) => {
        // If target is mutable or can receive config, transfer both
        if (or(isMutableArray, hasAnyItemType, hasNoItemConfig)(ctx.targetConfig)) {
          return arrayConfigAndValue(ctx)
        }

        // Otherwise just value
        return value(ctx)
      },

      onSourceUpdate: (ctx) => {
        // If target is mutable, ALWAYS transfer config and value
        if (isMutableArray(ctx.targetConfig)) {
          return arrayConfigAndValue(ctx)
        }

        // If target can receive config (any type or no config), transfer both
        if (or(hasAnyItemType, hasNoItemConfig)(ctx.targetConfig)) {
          return arrayConfigAndValue(ctx)
        }

        // Otherwise check compatibility before transferring value
        if (hasCompatibleArrayItems(ctx.sourceConfig, ctx.targetConfig)) {
          return value(ctx)
        }

        return {
          success: false,
          message: 'Array item types are incompatible',
        }
      },
    })
    .withPriority(60)
    .withDescription('Handle array to array connections')
    .build(),

  TransferEngine.rule('any-array-to-array')
    .from(hasUnderlyingArray)
    .to(isArray)
    .behaviors({
      canConnect: (source, target) => {
        // If target is mutable, always allow connection
        if (isMutableArray(target)) {
          return true
        }

        // If target accepts any items or has no config, allow
        if (or(hasAnyItemType, hasNoItemConfig)(target)) {
          return true
        }

        // Get the underlying array from the any port and check compatibility
        const underlying = (source as any).underlyingType || source
        if (underlying && underlying.type === 'array') {
          return hasCompatibleArrayItems(underlying, target)
        }

        return false
      },

      onConnect: (ctx) => {
        if (or(isMutableArray, hasAnyItemType, hasNoItemConfig)(ctx.targetConfig)) {
          return arrayConfigAndValue(ctx)
        }
        return value(ctx)
      },

      onSourceUpdate: (ctx) => {
        // If target is mutable, ALWAYS transfer config and value
        if (isMutableArray(ctx.targetConfig)) {
          return arrayConfigAndValue(ctx)
        }

        // If target can receive config, transfer both
        if (or(hasAnyItemType, hasNoItemConfig)(ctx.targetConfig)) {
          return arrayConfigAndValue(ctx)
        }

        // Check compatibility for any-wrapped arrays
        const underlying = (ctx.sourceConfig as any).underlyingType || ctx.sourceConfig
        if (underlying && underlying.type === 'array' && hasCompatibleArrayItems(underlying, ctx.targetConfig)) {
          return value(ctx)
        }

        return {
          success: false,
          message: 'Array item types are incompatible',
        }
      },
    })
    .withPriority(58)
    .withDescription('Handle any with underlying array to array connections')
    .build(),

  // ============================================
  // Simple Type Rules
  // ============================================
  TransferEngine.rule('string-to-string')
    .from(isString)
    .to(isString)
    .behaviors({
      onConnect: value,
      onSourceUpdate: value,
    })
    .withPriority(40)
    .withDescription('Transfer string value')
    .build(),

  TransferEngine.rule('number-to-number')
    .from(isNumber)
    .to(isNumber)
    .behaviors({
      onConnect: value,
      onSourceUpdate: value,
    })
    .withPriority(40)
    .withDescription('Transfer number value')
    .build(),

  TransferEngine.rule('boolean-to-boolean')
    .from(isBoolean)
    .to(isBoolean)
    .behaviors({
      onConnect: value,
      onSourceUpdate: value,
    })
    .withPriority(40)
    .withDescription('Transfer boolean value')
    .build(),

  // ============================================
  // Enum Transfer Rules
  // ============================================
  TransferEngine.rule('enum-to-enum')
    .from(isEnum)
    .to(isEnum)
    .behaviors({
      onConnect: value,
      onSourceUpdate: value,
    })
    .withPriority(40)
    .withDescription('Transfer enum value')
    .build(),

  TransferEngine.rule('any-with-enum-to-enum')
    .from(hasUnderlyingEnum)
    .to(isEnum)
    .behaviors({
      onConnect: value,
      onSourceUpdate: value,
    })
    .withPriority(38)
    .withDescription('Handle any port with underlying enum to enum connections')
    .build(),

  TransferEngine.rule('enum-to-any')
    .from(isEnum)
    .to(isAny)
    .behaviors({
      onConnect: underlyingTypeAndValue,
      onSourceUpdate: underlyingTypeAndValue,
    })
    .withPriority(35)
    .withDescription('Set enum as underlying type on any port')
    .build(),

  TransferEngine.rule('simple-type-to-any')
    .from(or(isString, isNumber, isBoolean))
    .to(isAny)
    .behaviors({
      onConnect: underlyingTypeAndValue,
      onSourceUpdate: underlyingTypeAndValue,
    })
    .withPriority(30)
    .withDescription('Set simple type as underlying on any port')
    .build(),

  // ============================================
  // Secret Transfer Rules
  // ============================================
  TransferEngine.rule('secret-to-secret')
    .from(isSecret)
    .to(isSecret)
    .behaviors({
      canConnect: (source, target) => {
        return hasCompatibleSecretTypes(source, target)
      },

      onConnect: value,
      onSourceUpdate: value,
    })
    .withPriority(50)
    .withDescription('Transfer secret value between compatible secret types')
    .build(),

  TransferEngine.rule('any-with-secret-to-secret')
    .from(hasUnderlyingSecret)
    .to(isSecret)
    .behaviors({
      canConnect: (source, target) => {
        // Get the actual underlying type (hasUnderlyingSecret already unwraps)
        const underlying = (source as any).underlyingType || source
        return underlying && hasCompatibleSecretTypes(underlying, target)
      },

      onConnect: value,
      onSourceUpdate: value,
    })
    .withPriority(48)
    .withDescription('Handle any port with underlying secret to secret connections')
    .build(),

  TransferEngine.rule('secret-to-any')
    .from(isSecret)
    .to(isAny)
    .behaviors({
      onConnect: underlyingTypeAndValue,
      onSourceUpdate: underlyingTypeAndValue,
    })
    .withPriority(33)
    .withDescription('Set secret as underlying type on any port')
    .build(),

  // ============================================
  // Stream Transfer Rules
  // ============================================
  TransferEngine.rule('stream-to-stream')
    .from(isStream)
    .to(isStream)
    .behaviors({
      canConnect: (source, target) => {
        // If target is mutable, always allow connection
        if (isMutableStream(target)) {
          return true
        }

        // If target accepts any items or has no config, allow
        if (or(hasAnyStreamItemType, hasNoStreamItemConfig)(target)) {
          return true
        }

        // Otherwise check item type compatibility recursively
        return hasCompatibleStreamItems(source, target)
      },

      onConnect: (ctx) => {
        // If target is mutable or can receive config, transfer both
        if (or(isMutableStream, hasAnyStreamItemType, hasNoStreamItemConfig)(ctx.targetConfig)) {
          return streamConfigAndValue(ctx)
        }

        // Otherwise just value
        return value(ctx)
      },

      onSourceUpdate: (ctx) => {
        // If target is mutable, ALWAYS transfer config and value
        if (isMutableStream(ctx.targetConfig)) {
          return streamConfigAndValue(ctx)
        }

        // If target can receive config (any type or no config), transfer both
        if (or(hasAnyStreamItemType, hasNoStreamItemConfig)(ctx.targetConfig)) {
          return streamConfigAndValue(ctx)
        }

        // Otherwise check compatibility before transferring value
        if (hasCompatibleStreamItems(ctx.sourceConfig, ctx.targetConfig)) {
          return value(ctx)
        }

        return {
          success: false,
          message: 'Stream item types are incompatible',
        }
      },
    })
    .withPriority(55)
    .withDescription('Handle stream to stream connections')
    .build(),

  TransferEngine.rule('any-stream-to-stream')
    .from(hasUnderlyingStream)
    .to(isStream)
    .behaviors({
      canConnect: (source, target) => {
        // If target is mutable, always allow connection
        if (isMutableStream(target)) {
          return true
        }

        // If target accepts any items or has no config, allow
        if (or(hasAnyStreamItemType, hasNoStreamItemConfig)(target)) {
          return true
        }

        // Get the underlying stream from the any port and check compatibility
        const underlying = (source as any).underlyingType || source
        if (underlying && underlying.type === 'stream') {
          return hasCompatibleStreamItems(underlying, target)
        }

        return false
      },

      onConnect: (ctx) => {
        if (or(isMutableStream, hasAnyStreamItemType, hasNoStreamItemConfig)(ctx.targetConfig)) {
          return streamConfigAndValue(ctx)
        }
        return value(ctx)
      },

      onSourceUpdate: (ctx) => {
        // If target is mutable, ALWAYS transfer config and value
        if (isMutableStream(ctx.targetConfig)) {
          return streamConfigAndValue(ctx)
        }

        // If target can receive config, transfer both
        if (or(hasAnyStreamItemType, hasNoStreamItemConfig)(ctx.targetConfig)) {
          return streamConfigAndValue(ctx)
        }
        return value(ctx)
      },
    })
    .withPriority(53)
    .withDescription('Handle any with underlying stream to stream connections')
    .build(),

  TransferEngine.rule('stream-to-any')
    .from(isStream)
    .to(isAny)
    .behaviors({
      onConnect: underlyingTypeAndValue,
      onSourceUpdate: underlyingTypeAndValue,
    })
    .withPriority(32)
    .withDescription('Set stream as underlying type on any port')
    .build(),
]

/**
 * Create a transfer engine with default rules
 */
export function createDefaultTransferEngine(): TransferEngine {
  return new TransferEngine(defaultTransferRules)
}

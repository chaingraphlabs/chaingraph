/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AnyPortConfig, ArrayPortConfig, IPortConfig, ObjectPortConfig, PortType, SecretPortConfig, StreamPortConfig } from '../base'
import type { PortPredicate } from './types'
import { isCompatibleSecretType } from '../base/secret'
import { unwrapAnyPort } from './utils/port-resolver'
import { checkSchemaCompatibility, isEmptyObjectSchema, isMutableObjectPort } from './utils/schema-compatibility'

/**
 * Library of reusable predicates for port matching
 */
export const Predicates = {
  // ============================================
  // Basic Type Predicates
  // ============================================

  /**
   * Check if port is of specific type
   */
  isType: (type: PortType): PortPredicate =>
    port => port.type === type,

  /**
   * Check if port is object type
   */
  isObject: (port: IPortConfig): boolean =>
    port.type === 'object',

  /**
   * Check if port is array type
   */
  isArray: (port: IPortConfig): boolean =>
    port.type === 'array',

  /**
   * Check if port is any type
   */
  isAny: (port: IPortConfig): boolean =>
    port.type === 'any',

  /**
   * Check if port is string type
   */
  isString: (port: IPortConfig): boolean =>
    port.type === 'string',

  /**
   * Check if port is number type
   */
  isNumber: (port: IPortConfig): boolean =>
    port.type === 'number',

  /**
   * Check if port is boolean type
   */
  isBoolean: (port: IPortConfig): boolean =>
    port.type === 'boolean',

  /**
   * Check if port is secret type
   */
  isSecret: (port: IPortConfig): boolean =>
    port.type === 'secret',

  /**
   * Check if port is stream type
   */
  isStream: (port: IPortConfig): boolean =>
    port.type === 'stream',

  // ============================================
  // Object-Specific Predicates
  // ============================================

  /**
   * Check if object port has mutable schema
   */
  isMutableObject: (port: IPortConfig): boolean => {
    if (port.type !== 'object')
      return false
    const objectPort = port as ObjectPortConfig
    return objectPort.isSchemaMutable === true
  },

  /**
   * Check if object port has immutable schema
   */
  isImmutableObject: (port: IPortConfig): boolean => {
    if (port.type !== 'object')
      return false
    const objectPort = port as ObjectPortConfig
    return objectPort.isSchemaMutable !== true
  },

  /**
   * Check if object port has empty schema
   */
  hasEmptySchema: (port: IPortConfig): boolean => {
    if (port.type !== 'object')
      return false
    const objectPort = port as ObjectPortConfig
    const properties = objectPort.schema?.properties || {}
    return Object.keys(properties).length === 0
  },

  /**
   * Check if object has specific property
   */
  hasProperty: (propertyName: string): PortPredicate =>
    (port) => {
      if (port.type !== 'object')
        return false
      const objectPort = port as ObjectPortConfig
      return propertyName in (objectPort.schema?.properties || {})
    },

  /**
   * Check if source schema is compatible with target schema using deep recursive checking
   * Compatible means source has all fields that target requires (source can have more)
   * Handles nested objects, arrays, and all complex types
   * This is used as a curried function: isSchemaCompatible(targetPort)(sourcePort)
   */
  isSchemaCompatible: (targetPort: IPortConfig): PortPredicate =>
    (sourcePort) => {
      const result = checkSchemaCompatibility(sourcePort, targetPort, {
        allowMutableEmptySchema: false, // Don't allow empty mutable bypass in strict check
        allowExtraProperties: true,
        debug: false,
      })
      return result.compatible
    },

  /**
   * Check if source and target have compatible schemas
   * This is for use in TransferContext where we have both configs
   */
  hasCompatibleSchemas: (sourceConfig: IPortConfig, targetConfig: IPortConfig): boolean => {
    const result = checkSchemaCompatibility(sourceConfig, targetConfig, {
      allowMutableEmptySchema: false,
      allowExtraProperties: true,
      debug: false,
    })
    return result.compatible
  },

  /**
   * Check if target has empty schema or source is compatible with target
   * Useful for mutable objects that can receive any schema when empty
   */
  isEmptyOrCompatibleSchema: (targetPort: IPortConfig): PortPredicate =>
    (sourcePort) => {
      // Must both be objects
      if (sourcePort.type !== 'object' || targetPort.type !== 'object') {
        return false
      }

      // If target has empty schema, any source object is compatible
      if (isEmptyObjectSchema(targetPort)) {
        return true
      }

      // Otherwise check full compatibility
      const result = checkSchemaCompatibility(sourcePort, targetPort, {
        allowMutableEmptySchema: false,
        allowExtraProperties: true,
        debug: false,
      })
      return result.compatible
    },

  /**
   * Check if object port can receive schema updates
   * This combines mutable check with schema compatibility
   */
  canReceiveSchema: (targetPort: IPortConfig): PortPredicate =>
    (sourcePort) => {
      // Must both be objects
      if (sourcePort.type !== 'object' || targetPort.type !== 'object') {
        return false
      }

      // If not mutable, cannot receive schema
      if (!isMutableObjectPort(targetPort)) {
        return false
      }

      // If empty schema, can receive any
      if (isEmptyObjectSchema(targetPort)) {
        return true
      }

      // Otherwise check compatibility
      const result = checkSchemaCompatibility(sourcePort, targetPort, {
        allowMutableEmptySchema: true,
        allowExtraProperties: true,
        debug: false,
      })
      return result.compatible
    },

  // ============================================
  // Any Port Predicates
  // ============================================

  /**
   * Check if any port has underlying type
   */
  hasUnderlyingType: (port: IPortConfig): boolean => {
    if (port.type !== 'any')
      return false
    const anyPort = port as AnyPortConfig
    return anyPort.underlyingType !== undefined
  },

  /**
   * Check if any port has no underlying type
   */
  hasNoUnderlyingType: (port: IPortConfig): boolean => {
    if (port.type !== 'any')
      return false
    const anyPort = port as AnyPortConfig
    return anyPort.underlyingType === undefined
  },

  /**
   * Check if any port has underlying object type
   */
  hasUnderlyingObject: (port: IPortConfig): boolean => {
    if (port.type !== 'any')
      return false
    const underlying = unwrapAnyPort(port)
    return underlying?.type === 'object'
  },

  /**
   * Check if any port has underlying array type
   */
  hasUnderlyingArray: (port: IPortConfig): boolean => {
    if (port.type !== 'any')
      return false
    const underlying = unwrapAnyPort(port)
    return underlying?.type === 'array'
  },

  /**
   * Check if any port has specific underlying type
   */
  hasUnderlyingType_: (type: PortType): PortPredicate =>
    (port) => {
      if (port.type !== 'any')
        return false
      const underlying = unwrapAnyPort(port)
      return underlying?.type === type
    },

  // ============================================
  // Array-Specific Predicates
  // ============================================

  /**
   * Check if array has mutable item schema
   */
  isMutableArray: (port: IPortConfig): boolean => {
    if (port.type !== 'array')
      return false
    const arrayPort = port as ArrayPortConfig
    return arrayPort.isSchemaMutable === true
  },

  /**
   * Check if array has any item type
   */
  hasAnyItemType: (port: IPortConfig): boolean => {
    if (port.type !== 'array')
      return false
    const arrayPort = port as ArrayPortConfig
    return !arrayPort.itemConfig || arrayPort.itemConfig.type === 'any'
  },

  /**
   * Check if array has specific item type
   */
  hasItemType: (type: PortType): PortPredicate =>
    (port) => {
      if (port.type !== 'array')
        return false
      const arrayPort = port as ArrayPortConfig
      return arrayPort.itemConfig?.type === type
    },

  /**
   * Check if array has no item config
   */
  hasNoItemConfig: (port: IPortConfig): boolean => {
    if (port.type !== 'array')
      return false
    const arrayPort = port as ArrayPortConfig
    return arrayPort.itemConfig === undefined || !('type' in arrayPort.itemConfig)
  },

  /**
   * Check if two arrays have compatible item types
   * Uses recursive schema checking for complex item types
   */
  hasCompatibleArrayItems: (source: IPortConfig, target: IPortConfig): boolean => {
    if (source.type !== 'array' || target.type !== 'array')
      return false

    const sourceArray = source as ArrayPortConfig
    const targetArray = target as ArrayPortConfig

    // If target accepts any items or has no config, it's compatible
    if (!targetArray.itemConfig || targetArray.itemConfig.type === 'any')
      return true

    // If source has no item config, it can't match target requirements
    if (!sourceArray.itemConfig)
      return false

    // Recursively check item compatibility
    const result = checkSchemaCompatibility(sourceArray.itemConfig, targetArray.itemConfig, {
      allowMutableEmptySchema: false,
      allowExtraProperties: true,
      debug: false,
    })
    return result.compatible
  },

  // ============================================
  // Secret-Specific Predicates
  // ============================================

  /**
   * Check if two secret ports have compatible secret types
   */
  hasCompatibleSecretTypes: (source: IPortConfig, target: IPortConfig): boolean => {
    if (source.type !== 'secret' || target.type !== 'secret')
      return false
    const sourceSecret = source as SecretPortConfig
    const targetSecret = target as SecretPortConfig
    return isCompatibleSecretType(sourceSecret.secretType, targetSecret.secretType)
  },

  /**
   * Check if secret has specific secret type
   */
  hasSecretType: (secretType: string): PortPredicate =>
    (port) => {
      if (port.type !== 'secret')
        return false
      const secretPort = port as SecretPortConfig
      return secretPort.secretType === secretType
    },

  /**
   * Check if any port has underlying secret type
   */
  hasUnderlyingSecret: (port: IPortConfig): boolean => {
    if (port.type !== 'any')
      return false
    const underlying = unwrapAnyPort(port)
    return underlying?.type === 'secret'
  },

  // ============================================
  // Stream-Specific Predicates
  // ============================================

  /**
   * Check if stream has mutable item schema
   */
  isMutableStream: (port: IPortConfig): boolean => {
    if (port.type !== 'stream')
      return false
    const streamPort = port as StreamPortConfig
    return streamPort.isSchemaMutable === true
  },

  /**
   * Check if stream has any item type
   */
  hasAnyStreamItemType: (port: IPortConfig): boolean => {
    if (port.type !== 'stream')
      return false
    const streamPort = port as StreamPortConfig
    return !streamPort.itemConfig || streamPort.itemConfig.type === 'any'
  },

  /**
   * Check if stream has specific item type
   */
  hasStreamItemType: (type: PortType): PortPredicate =>
    (port) => {
      if (port.type !== 'stream')
        return false
      const streamPort = port as StreamPortConfig
      return streamPort.itemConfig?.type === type
    },

  /**
   * Check if stream has no item config
   */
  hasNoStreamItemConfig: (port: IPortConfig): boolean => {
    if (port.type !== 'stream')
      return false
    const streamPort = port as StreamPortConfig
    return streamPort.itemConfig === undefined || !('type' in streamPort.itemConfig)
  },

  /**
   * Check if two streams have compatible item types
   * Uses recursive schema checking for complex item types
   */
  hasCompatibleStreamItems: (source: IPortConfig, target: IPortConfig): boolean => {
    if (source.type !== 'stream' || target.type !== 'stream')
      return false

    const sourceStream = source as StreamPortConfig
    const targetStream = target as StreamPortConfig

    // If target accepts any items or has no config, it's compatible
    if (!targetStream.itemConfig || targetStream.itemConfig.type === 'any')
      return true

    // If source has no item config, it can't match target requirements
    if (!sourceStream.itemConfig)
      return false

    // Recursively check item compatibility
    const result = checkSchemaCompatibility(sourceStream.itemConfig, targetStream.itemConfig, {
      allowMutableEmptySchema: false,
      allowExtraProperties: true,
      debug: false,
    })
    return result.compatible
  },

  /**
   * Check if any port has underlying stream type
   */
  hasUnderlyingStream: (port: IPortConfig): boolean => {
    if (port.type !== 'any')
      return false
    const underlying = unwrapAnyPort(port)
    return underlying?.type === 'stream'
  },

  // ============================================
  // Logical Combinators
  // ============================================

  /**
   * Combine predicates with AND logic
   */
  and: (...predicates: PortPredicate[]): PortPredicate =>
    port => predicates.every(predicate => predicate(port)),

  /**
   * Combine predicates with OR logic
   */
  or: (...predicates: PortPredicate[]): PortPredicate =>
    port => predicates.some(predicate => predicate(port)),

  /**
   * Negate a predicate
   */
  not: (predicate: PortPredicate): PortPredicate =>
    port => !predicate(port),

  /**
   * Always true predicate
   */
  always: (): boolean => true,

  /**
   * Always false predicate
   */
  never: (): boolean => false,
}

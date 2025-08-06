/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPortConfig,
  ArrayPortConfig,
  IPortConfig,
  ObjectPortConfig,
  StreamPortConfig,
} from '../../base'

/**
 * Options for schema compatibility checking
 */
export interface SchemaCompatibilityOptions {
  /** Maximum recursion depth to prevent stack overflow */
  maxDepth?: number
  /** Whether to allow mutable empty schemas to accept any source */
  allowMutableEmptySchema?: boolean
  /** Whether to allow source to have extra properties beyond target requirements */
  allowExtraProperties?: boolean
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Result of schema compatibility check
 */
export interface SchemaCompatibilityResult {
  compatible: boolean
  reason?: string
  path?: string[]
}

/**
 * Check if two port configurations have compatible schemas
 * This is the main entry point for schema compatibility checking
 */
export function checkSchemaCompatibility(
  sourceConfig: IPortConfig,
  targetConfig: IPortConfig,
  options: SchemaCompatibilityOptions = {},
): SchemaCompatibilityResult {
  const opts: Required<SchemaCompatibilityOptions> = {
    maxDepth: options.maxDepth ?? 10,
    allowMutableEmptySchema: options.allowMutableEmptySchema ?? true,
    allowExtraProperties: options.allowExtraProperties ?? true,
    debug: options.debug ?? false,
  }

  return checkCompatibilityRecursive(sourceConfig, targetConfig, opts, 0, [])
}

/**
 * Recursive implementation of schema compatibility checking
 */
function checkCompatibilityRecursive(
  sourceConfig: IPortConfig,
  targetConfig: IPortConfig,
  options: Required<SchemaCompatibilityOptions>,
  depth: number,
  path: string[],
): SchemaCompatibilityResult {
  // Check recursion depth
  if (depth > options.maxDepth) {
    return {
      compatible: false,
      reason: `Maximum recursion depth (${options.maxDepth}) exceeded`,
      path,
    }
  }

  if (options.debug) {
    console.log(`[SchemaCompatibility] Checking at depth ${depth}, path: ${path.join('.')}, types: ${sourceConfig.type} -> ${targetConfig.type}`)
  }

  // Unwrap any ports to their underlying types
  const unwrappedSource = unwrapAnyPort(sourceConfig)
  const unwrappedTarget = unwrapAnyPort(targetConfig)

  // Handle any type targets (can accept anything)
  if (!unwrappedTarget || unwrappedTarget.type === 'any') {
    return { compatible: true }
  }

  // Source must have a concrete type to match target
  if (!unwrappedSource || unwrappedSource.type === 'any') {
    return {
      compatible: false,
      reason: 'Source has no concrete type to match target requirements',
      path,
    }
  }

  // Types must match (or be compatible)
  if (unwrappedSource.type !== unwrappedTarget.type) {
    return {
      compatible: false,
      reason: `Type mismatch: ${unwrappedSource.type} cannot connect to ${unwrappedTarget.type}`,
      path,
    }
  }

  // Handle specific type compatibility
  switch (unwrappedSource.type) {
    case 'object':
      return checkObjectCompatibility(
        unwrappedSource as ObjectPortConfig,
        unwrappedTarget as ObjectPortConfig,
        options,
        depth,
        path,
      )

    case 'array':
      return checkArrayCompatibility(
        unwrappedSource as ArrayPortConfig,
        unwrappedTarget as ArrayPortConfig,
        options,
        depth,
        path,
      )

    case 'stream':
      return checkStreamCompatibility(
        unwrappedSource as StreamPortConfig,
        unwrappedTarget as StreamPortConfig,
        options,
        depth,
        path,
      )

    case 'secret':
      // TODO: add secret compatibility logic
      return { compatible: true }

    // Primitive types (string, number, boolean, enum, secret)
    default:
      // For primitive types, type match is sufficient
      return { compatible: true }
  }
}

/**
 * Check compatibility between object schemas
 */
function checkObjectCompatibility(
  sourceConfig: ObjectPortConfig,
  targetConfig: ObjectPortConfig,
  options: Required<SchemaCompatibilityOptions>,
  depth: number,
  path: string[],
): SchemaCompatibilityResult {
  const sourceSchema = sourceConfig.schema
  const targetSchema = targetConfig.schema

  // Special case: Mutable target with empty schema can accept any source
  if (
    options.allowMutableEmptySchema
    && targetConfig.isSchemaMutable
    && Object.keys(targetSchema.properties).length === 0
  ) {
    if (options.debug) {
      console.log(`[SchemaCompatibility] Target is mutable with empty schema, accepting any source`)
    }
    return { compatible: true }
  }

  // Check that source has all properties required by target
  for (const [propKey, targetProp] of Object.entries(targetSchema.properties)) {
    const sourceProp = sourceSchema.properties[propKey]

    if (!sourceProp) {
      return {
        compatible: false,
        reason: `Missing required property: ${propKey}`,
        path: [...path, propKey],
      }
    }

    // Recursively check property compatibility
    const propResult = checkCompatibilityRecursive(
      sourceProp,
      targetProp,
      options,
      depth + 1,
      [...path, propKey],
    )

    if (!propResult.compatible) {
      return propResult
    }
  }

  // If we don't allow extra properties, check that source doesn't have extras
  if (!options.allowExtraProperties) {
    for (const propKey of Object.keys(sourceSchema.properties)) {
      if (!(propKey in targetSchema.properties)) {
        return {
          compatible: false,
          reason: `Extra property not allowed: ${propKey}`,
          path: [...path, propKey],
        }
      }
    }
  }

  return { compatible: true }
}

/**
 * Check compatibility between array configurations
 */
function checkArrayCompatibility(
  sourceConfig: ArrayPortConfig,
  targetConfig: ArrayPortConfig,
  options: Required<SchemaCompatibilityOptions>,
  depth: number,
  path: string[],
): SchemaCompatibilityResult {
  // If target accepts any item type, it's compatible
  if (!targetConfig.itemConfig || targetConfig.itemConfig.type === 'any') {
    return { compatible: true }
  }

  // Source must have item config to match target
  if (!sourceConfig.itemConfig) {
    return {
      compatible: false,
      reason: 'Source array has no item configuration',
      path: [...path, '[]'],
    }
  }

  // Recursively check item type compatibility
  return checkCompatibilityRecursive(
    sourceConfig.itemConfig,
    targetConfig.itemConfig,
    options,
    depth + 1,
    [...path, '[]'],
  )
}

/**
 * Check compatibility between stream configurations
 * Streams are similar to arrays - they have item types
 */
function checkStreamCompatibility(
  sourceConfig: StreamPortConfig,
  targetConfig: StreamPortConfig,
  options: Required<SchemaCompatibilityOptions>,
  depth: number,
  path: string[],
): SchemaCompatibilityResult {
  // If target accepts any item type, it's compatible
  if (!targetConfig.itemConfig || targetConfig.itemConfig.type === 'any') {
    return { compatible: true }
  }

  // Source must have item config to match target
  if (!sourceConfig.itemConfig) {
    return {
      compatible: false,
      reason: 'Source stream has no item configuration',
      path: [...path, 'stream'],
    }
  }

  // Recursively check item type compatibility
  return checkCompatibilityRecursive(
    sourceConfig.itemConfig,
    targetConfig.itemConfig,
    options,
    depth + 1,
    [...path, 'stream'],
  )
}

/**
 * Unwrap any port to get its underlying type
 * Handles nested any ports recursively
 */
function unwrapAnyPort(config: IPortConfig): IPortConfig | undefined {
  if (config.type !== 'any') {
    return config
  }

  const anyConfig = config as AnyPortConfig
  let underlyingType = anyConfig.underlyingType
  let depth = 0
  const maxDepth = 10

  // Keep unwrapping nested 'any' types until we find a concrete type
  while (
    underlyingType
    && underlyingType.type === 'any'
    && (underlyingType as AnyPortConfig).underlyingType
    && depth < maxDepth
  ) {
    underlyingType = (underlyingType as AnyPortConfig).underlyingType
    depth++
  }

  if (depth >= maxDepth) {
    console.warn('[SchemaCompatibility] Maximum depth reached while unwrapping any port')
    return undefined
  }

  return underlyingType
}

/**
 * Quick check if a port config represents an empty object schema
 */
export function isEmptyObjectSchema(config: IPortConfig): boolean {
  if (config.type !== 'object') {
    return false
  }
  const objectConfig = config as ObjectPortConfig
  return Object.keys(objectConfig.schema?.properties || {}).length === 0
}

/**
 * Quick check if a port config is a mutable object
 */
export function isMutableObjectPort(config: IPortConfig): boolean {
  if (config.type !== 'object') {
    return false
  }
  const objectConfig = config as ObjectPortConfig
  return objectConfig.isSchemaMutable === true
}

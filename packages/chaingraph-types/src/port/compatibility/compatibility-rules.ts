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
  IObjectSchema,
  IPortConfig,
  ObjectPortConfig,
  PortType,
  SecretPortConfig,
} from '../base'

import { isCompatibleSecretType } from '../base/secret'

/**
 * Interface for recursive compatibility checking.
 * This allows rules to delegate nested type checking back to the main checker.
 */
export interface IRecursiveCompatibilityChecker {
  /**
   * Check if two port configurations are compatible, tracking recursion depth.
   * @param sourceConfig Source port configuration
   * @param targetConfig Target port configuration
   * @param depth Current recursion depth (used to prevent stack overflow)
   * @returns true if configurations are compatible
   */
  checkConfigs: (sourceConfig: IPortConfig, targetConfig: IPortConfig, depth: number) => boolean
}

/**
 * Interface for defining compatibility rules between port types.
 *
 * Port compatibility determines whether data can flow from a source port to a target port
 * in a node-based flow graph. This is crucial for:
 * - Type safety: Ensuring data types match between connected nodes
 * - Data integrity: Preventing runtime errors from incompatible data transfers
 * - Visual feedback: Allowing UI to show which connections are valid before they're made
 *
 * Each rule defines how to check if a specific source port type can connect to a target port type.
 * For example, a string output port can only connect to a string input port, unless the target
 * accepts 'any' type.
 */
export interface ICompatibilityRule {
  /** The source port type this rule applies to */
  sourceType: PortType

  /** The target port type this rule applies to */
  targetType: PortType

  /**
   * Checks if the source port configuration is compatible with the target port configuration.
   * Returns true if data can flow from source to target, false otherwise.
   *
   * @param sourceConfig Source port configuration
   * @param targetConfig Target port configuration
   * @param checker Optional recursive checker for nested type compatibility
   */
  checkCompatibility: (
    sourceConfig: IPortConfig,
    targetConfig: IPortConfig,
    checker?: IRecursiveCompatibilityChecker
  ) => boolean

  /**
   * Optional method to provide a human-readable error message when ports are incompatible.
   * This helps users understand why a connection cannot be made.
   */
  getErrorMessage?: (sourceConfig: IPortConfig, targetConfig: IPortConfig) => string
}

/**
 * Compatibility rule for ports of the same type.
 *
 * This is the most basic compatibility check - ensuring that data types match exactly.
 * For example:
 * - A string output can connect to a string input
 * - A number output can connect to a number input
 * - But a string output cannot connect to a number input
 *
 * This rule is fundamental for maintaining type safety in the flow graph.
 */
export class SameTypeCompatibilityRule implements ICompatibilityRule {
  constructor(
    public sourceType: PortType,
    public targetType: PortType,
  ) {}

  checkCompatibility(
    sourceConfig: IPortConfig,
    targetConfig: IPortConfig,
    checker?: IRecursiveCompatibilityChecker,
  ): boolean {
    return sourceConfig.type === targetConfig.type
  }

  getErrorMessage(sourceConfig: IPortConfig, targetConfig: IPortConfig): string {
    return `Incompatible port types: ${sourceConfig.type} -> ${targetConfig.type}`
  }
}

/**
 * Compatibility rule for 'any' type ports with type unwrapping.
 *
 * This rule handles 'any' type ports by unwrapping their underlying types when present.
 * Both source and target ports are unwrapped before applying compatibility rules:
 *
 * After unwrapping, the following rules apply:
 * 1. any -> any: Allowed - both ports have no concrete type
 * 2. type -> any: Allowed - typed data can flow to generic receivers
 * 3. any -> type: Not allowed - cannot validate unknown source against typed target
 * 4. type -> type: Delegates to standard type compatibility rules
 *
 * Examples:
 * - A variable getter with underlying type 'string' can connect to a string input
 * - A generic debug node (any) can receive data from any typed output
 * - An untyped 'any' output cannot connect to a typed input (type safety)
 *
 * This ensures type safety while maintaining flexibility for generic nodes.
 */
export class AnyTypeCompatibilityRule implements ICompatibilityRule {
  constructor(
    public sourceType: PortType,
    public targetType: PortType,
  ) {}

  checkCompatibility(
    sourceConfig: IPortConfig,
    targetConfig: IPortConfig,
    checker?: IRecursiveCompatibilityChecker,
  ): boolean {
    // Unwrap both source and target if they are 'any' types
    const unwrappedSource = this.unwrapUnderlyingType(sourceConfig)
    const unwrappedTarget = this.unwrapUnderlyingType(targetConfig)

    // Determine the effective types after unwrapping
    const sourceIsAny = !unwrappedSource || unwrappedSource.type === 'any'
    const targetIsAny = !unwrappedTarget || unwrappedTarget.type === 'any'

    // Apply the four compatibility rules:
    // 1. any -> any: allowed
    if (sourceIsAny && targetIsAny) {
      return true
    }

    // 2. type -> any: allowed
    if (!sourceIsAny && targetIsAny) {
      return true
    }

    // 3. any -> type: not allowed (can't validate unknown source type)
    if (sourceIsAny && !targetIsAny) {
      return false
    }

    // 4. type -> type: check with standard rules
    if (!sourceIsAny && !targetIsAny && checker) {
      return checker.checkConfigs(unwrappedSource, unwrappedTarget, 0)
    }

    // Fallback if no checker available
    return !!unwrappedSource?.type
      && !!unwrappedTarget?.type
      && unwrappedSource.type === unwrappedTarget.type
  }

  private unwrapUnderlyingType(config: IPortConfig): IPortConfig | undefined {
    // If it's not an 'any' type, return the config as-is
    if (config.type !== 'any') {
      return config
    }

    const anyConfig = config as AnyPortConfig
    const maxDepth = 10 // Prevent infinite loops in case of circular references
    let underlyingType = anyConfig.underlyingType
    let depth = 0

    // Keep unwrapping nested 'any' types until we find a concrete type or reach max depth
    while (underlyingType && underlyingType.type === 'any' && (underlyingType as AnyPortConfig).underlyingType && depth < maxDepth) {
      underlyingType = (underlyingType as AnyPortConfig).underlyingType
      depth++
    }

    if (depth >= maxDepth) {
      throw new Error('Maximum depth reached while unwrapping underlying type')
    }

    return underlyingType
  }

  getErrorMessage(sourceConfig: IPortConfig, targetConfig: IPortConfig): string {
    const unwrappedSource = this.unwrapUnderlyingType(sourceConfig)
    const unwrappedTarget = this.unwrapUnderlyingType(targetConfig)

    const sourceIsAny = !unwrappedSource || unwrappedSource.type === 'any'
    const targetIsAny = !unwrappedTarget || unwrappedTarget.type === 'any'

    if (sourceIsAny && !targetIsAny) {
      return `Cannot connect 'any' type without underlying type to '${unwrappedTarget.type}' - unable to validate type compatibility`
    }

    const sourceType = unwrappedSource?.type || 'any'
    const targetType = unwrappedTarget?.type || 'any'

    return `Incompatible port types after unwrapping: ${sourceType} -> ${targetType}`
  }
}

/**
 * Compatibility rule for secret ports.
 *
 * Secret ports handle sensitive data like API keys, passwords, and tokens.
 * This rule ensures that secrets maintain their type safety:
 * - Only secrets of compatible types can be connected
 * - Prevents accidentally exposing secrets through incompatible connections
 *
 * Example: An API key secret can only connect to nodes expecting API keys,
 * not to nodes expecting database passwords.
 */
export class SecretCompatibilityRule implements ICompatibilityRule {
  sourceType: PortType = 'secret'
  targetType: PortType = 'secret'

  checkCompatibility(
    sourceConfig: IPortConfig,
    targetConfig: IPortConfig,
    checker?: IRecursiveCompatibilityChecker,
  ): boolean {
    if (sourceConfig.type !== 'secret' || targetConfig.type !== 'secret') {
      return false
    }

    const sourceSecretConfig = sourceConfig as SecretPortConfig<any>
    const targetSecretConfig = targetConfig as SecretPortConfig<any>

    return isCompatibleSecretType(
      sourceSecretConfig.secretType,
      targetSecretConfig.secretType,
    )
  }

  getErrorMessage(sourceConfig: IPortConfig, targetConfig: IPortConfig): string {
    const sourceSecretConfig = sourceConfig as SecretPortConfig<any>
    const targetSecretConfig = targetConfig as SecretPortConfig<any>
    return `Incompatible secret types: ${sourceSecretConfig.secretType} -> ${targetSecretConfig.secretType}`
  }
}

/**
 * Compatibility rule for array ports.
 *
 * Arrays need special handling because compatibility depends on the type of items they contain.
 * This rule checks:
 * - Both ports must be array types
 * - The item types within the arrays must be compatible
 *
 * Example: An array of strings can only connect to nodes expecting string arrays,
 * not to nodes expecting number arrays.
 */
export class ArrayCompatibilityRule implements ICompatibilityRule {
  sourceType: PortType = 'array'
  targetType: PortType = 'array'

  checkCompatibility(
    sourceConfig: IPortConfig,
    targetConfig: IPortConfig,
    checker?: IRecursiveCompatibilityChecker,
  ): boolean {
    if (sourceConfig.type !== 'array' || targetConfig.type !== 'array') {
      return false
    }

    const sourceArrayConfig = sourceConfig as ArrayPortConfig
    const targetArrayConfig = targetConfig as ArrayPortConfig

    // Check if item types are compatible
    if (targetArrayConfig.itemConfig.type === 'any') {
      return true
    }

    // Use recursive checker if available for deep type compatibility
    if (checker) {
      return checker.checkConfigs(
        sourceArrayConfig.itemConfig,
        targetArrayConfig.itemConfig,
        1, // Start at depth 1 since we're already inside an array
      )
    }

    // Fallback to simple type check if no checker available
    return sourceArrayConfig.itemConfig.type === targetArrayConfig.itemConfig.type
  }

  getErrorMessage(sourceConfig: IPortConfig, targetConfig: IPortConfig): string {
    const sourceArrayConfig = sourceConfig as ArrayPortConfig
    const targetArrayConfig = targetConfig as ArrayPortConfig
    return `Incompatible array item types: ${sourceArrayConfig.itemConfig.type}[] -> ${targetArrayConfig.itemConfig.type}[]`
  }
}

/**
 * Compatibility rule for object ports.
 *
 * Object ports have the most complex compatibility requirements because they contain
 * structured data with multiple properties. This rule performs deep schema validation:
 *
 * - All properties required by the target schema must exist in the source schema
 * - Each property type must be compatible (including nested objects and arrays)
 * - Source can have additional properties beyond what target requires (source "implements" target)
 *
 * Special case - Schema Capture:
 * If the target port has `isSchemaMutable: true` and an empty schema (no properties),
 * it can accept connections from any object source. This allows generic nodes to
 * dynamically adapt their schema based on what's connected to them.
 *
 * Examples:
 * 1. Normal validation: A source with {name: string, age: number, email: string} can connect to
 *    a target expecting {name: string, age: number} because source has all required properties
 * 2. Source can have extra fields: A source with {a: string, b: number, c: {h: number, d: enum}}
 *    can connect to a target expecting {b: number, c: {d: enum}}
 * 3. Schema capture: A mutable target with {} can accept any object source and
 *    will capture its schema for runtime processing
 *
 * This follows the principle that the source must "implement" or satisfy all requirements
 * of the target, while allowing the source to provide additional data that the target
 * may choose to ignore.
 */
export class ObjectCompatibilityRule implements ICompatibilityRule {
  sourceType: PortType = 'object'
  targetType: PortType = 'object'

  checkCompatibility(
    sourceConfig: IPortConfig,
    targetConfig: IPortConfig,
    checker?: IRecursiveCompatibilityChecker,
  ): boolean {
    if (sourceConfig.type !== 'object' || targetConfig.type !== 'object') {
      return false
    }

    const sourceObjectConfig = sourceConfig as ObjectPortConfig<IObjectSchema>
    const targetObjectConfig = targetConfig as ObjectPortConfig<IObjectSchema>

    // Special case: If target schema is mutable and has no properties,
    // it can accept any source schema (it will capture the schema)
    if (targetObjectConfig.isSchemaMutable
      && Object.keys(targetObjectConfig.schema.properties).length === 0) {
      return true
    }

    return this.checkSchemaCompatibility(
      sourceObjectConfig.schema,
      targetObjectConfig.schema,
      checker,
      1, // Start at depth 1 since we're already inside an object
    )
  }

  private checkSchemaCompatibility(
    sourceSchema: IObjectSchema,
    targetSchema: IObjectSchema,
    checker?: IRecursiveCompatibilityChecker,
    depth: number = 0,
  ): boolean {
    // Check if all properties in the target schema exist and are compatible in the source schema
    // This ensures the source object "implements" or satisfies all requirements of the target
    for (const [propertyKey, targetPropertyConfig] of Object.entries(targetSchema.properties)) {
      const sourcePropertyConfig = sourceSchema.properties[propertyKey]

      // Property doesn't exist in source schema
      if (!sourcePropertyConfig) {
        return false
      }

      // Check if property types are compatible
      if (checker) {
        // Use the checker for recursive type checking
        if (!checker.checkConfigs(sourcePropertyConfig, targetPropertyConfig, depth + 1)) {
          return false
        }
      } else {
        // Fallback to simple type check
        if (!this.arePropertyTypesCompatible(sourcePropertyConfig, targetPropertyConfig)) {
          return false
        }
      }
    }

    return true
  }

  private arePropertyTypesCompatible(
    sourceConfig: IPortConfig,
    targetConfig: IPortConfig,
  ): boolean {
    // Allow 'any' type to accept any type
    if (targetConfig.type === 'any') {
      return true
    }

    // Types must match for compatibility
    if (sourceConfig.type !== targetConfig.type) {
      return false
    }

    // For nested objects, recursively check compatibility
    if (sourceConfig.type === 'object' && targetConfig.type === 'object') {
      const sourceObjectConfig = sourceConfig as ObjectPortConfig<IObjectSchema>
      const targetObjectConfig = targetConfig as ObjectPortConfig<IObjectSchema>
      return this.checkSchemaCompatibility(
        sourceObjectConfig.schema,
        targetObjectConfig.schema,
      )
    }

    // For arrays, check item compatibility
    if (sourceConfig.type === 'array' && targetConfig.type === 'array') {
      const sourceArrayConfig = sourceConfig as ArrayPortConfig
      const targetArrayConfig = targetConfig as ArrayPortConfig
      return this.arePropertyTypesCompatible(
        sourceArrayConfig.itemConfig,
        targetArrayConfig.itemConfig,
      )
    }

    return true
  }

  getErrorMessage(sourceConfig: IPortConfig, targetConfig: IPortConfig): string {
    return 'Object schemas are not compatible: source does not implement all properties required by target'
  }
}

/**
 * Get all compatibility rules for the port system.
 *
 * This function returns a comprehensive set of rules that define how different
 * port types can connect to each other in the flow graph. The rules are ordered
 * from most specific (complex types) to most general (simple types).
 *
 * The rule system enables:
 * - Type-safe connections between nodes
 * - Runtime validation before data transfer
 * - Clear error messages for invalid connections
 * - Support for flexible 'any' type connections
 *
 * @returns Array of all compatibility rules used by the system
 */
export function getCompatibilityRules(): ICompatibilityRule[] {
  const rules: ICompatibilityRule[] = []

  // Add specific rules for complex types
  rules.push(new SecretCompatibilityRule())
  rules.push(new ArrayCompatibilityRule())
  rules.push(new ObjectCompatibilityRule())

  // TODO: the Stream port is actually complex port. It is like an array. Change the logic to handle it as such

  // Add rules for 'any' type combinations
  const portTypes: PortType[] = ['string', 'number', 'boolean', 'array', 'object', 'stream', 'enum', 'secret']
  for (const type of portTypes) {
    rules.push(new AnyTypeCompatibilityRule(type, 'any'))
    rules.push(new AnyTypeCompatibilityRule('any', type))
  }
  rules.push(new AnyTypeCompatibilityRule('any', 'any'))

  // Add same-type rules for simple types
  const simpleTypes: PortType[] = ['string', 'number', 'boolean', 'stream', 'enum']
  for (const type of simpleTypes) {
    rules.push(new SameTypeCompatibilityRule(type, type))
  }

  return rules
}

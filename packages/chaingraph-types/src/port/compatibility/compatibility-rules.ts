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
 * Compatibility rule for 'any' type ports.
 *
 * The 'any' type provides flexibility in the flow graph by allowing dynamic typing.
 * This rule handles two scenarios:
 *
 * 1. Target port is 'any': Can accept data from any source port type
 *    Example: A debug/logging node that can display any data type
 *
 * 2. Source port is 'any': Can connect to any target, but may have an underlying type
 *    Example: A variable getter that returns different types based on the variable name
 *
 * This flexibility is useful for generic nodes but requires careful runtime handling.
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
    // If target is 'any', it can accept any source
    if (targetConfig.type === 'any') {
      return true
    }

    console.log(`[AnyTypeCompatibilityRule] Checking compatibility for source 'any' with underlying type:`, sourceConfig)

    // If source is 'any', check if it has an underlying type
    if (sourceConfig.type === 'any') {
      const anyConfig = sourceConfig as AnyPortConfig
      const underlyingType = this.unwrapUnderlyingType(anyConfig)

      console.log(`[AnyTypeCompatibilityRule] Checking compatibility for source 'any' with underlying type:`, underlyingType)

      if (underlyingType && checker) {
        // Use the checker to validate underlying type compatibility
        return checker.checkConfigs(underlyingType, targetConfig, 0)
      } else if (underlyingType) {
        // Fallback to simple type check if no checker available
        return underlyingType.type === targetConfig.type
      }

      // If no underlying type, allow connection (will be determined at runtime)
      return true
    }

    return false
  }

  private unwrapUnderlyingType(anyConfig: AnyPortConfig): IPortConfig | undefined {
    const maxDepth = 10 // Prevent infinite loops in case of circular references
    let underlyingType = anyConfig.underlyingType
    let depth = 0
    while (underlyingType && underlyingType.type === 'any' && underlyingType.underlyingType && depth < maxDepth) {
      underlyingType = underlyingType.underlyingType
      depth++
    }

    if (depth >= maxDepth) {
      throw new Error('Maximum depth reached while unwrapping underlying type')
    }

    return underlyingType
  }

  getErrorMessage(sourceConfig: IPortConfig, targetConfig: IPortConfig): string {
    return `Incompatible port types: ${sourceConfig.type} -> ${targetConfig.type}`
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
 * - All properties in the source schema must exist in the target schema
 * - Each property type must be compatible (including nested objects and arrays)
 * - Target can have additional properties (source is a subset of target)
 *
 * Special case - Schema Capture:
 * If the target port has `isSchemaMutable: true` and an empty schema (no properties),
 * it can accept connections from any object source. This allows generic nodes to
 * dynamically adapt their schema based on what's connected to them.
 *
 * Examples:
 * 1. Normal validation: A source with {name: string, age: number} can connect to
 *    a target expecting {name: string, age: number, email?: string}
 * 2. Schema capture: A mutable target with {} can accept any object source and
 *    will capture its schema for runtime processing
 *
 * This ensures that nodes receive all the data they expect to process correctly,
 * while also enabling flexible, generic node implementations.
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
    // Check if all properties in the source schema exist and are compatible in the target schema
    for (const [propertyKey, sourcePropertyConfig] of Object.entries(sourceSchema.properties)) {
      const targetPropertyConfig = targetSchema.properties[propertyKey]

      // Property doesn't exist in target schema
      if (!targetPropertyConfig) {
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
    return 'Object schemas are not compatible: source properties do not match target schema requirements'
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

  // Add rules for 'any' type combinations
  const portTypes: PortType[] = ['string', 'number', 'boolean', 'array', 'object', 'stream', 'enum', 'secret', 'any']
  for (const type of portTypes) {
    rules.push(new AnyTypeCompatibilityRule(type, 'any'))
  }
  rules.push(new AnyTypeCompatibilityRule('any', 'any'))

  // Add same-type rules for simple types
  const simpleTypes: PortType[] = ['string', 'number', 'boolean', 'stream', 'enum']
  for (const type of simpleTypes) {
    rules.push(new SameTypeCompatibilityRule(type, type))
  }

  return rules
}

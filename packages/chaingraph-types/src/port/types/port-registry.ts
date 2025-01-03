import type { PortType } from './port-types'
import type { PortValue } from './port-values'

/**
 * Type validation result
 */
export interface TypeValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Port type handler interface
 */
export interface PortTypeHandler<T extends PortType> {
  /**
   * Validate a value against this type
   */
  validate: (value: unknown) => TypeValidationResult

  /**
   * Convert a value to this type's format
   */
  convert: (value: unknown) => PortValue<T>

  /**
   * Get default value for this type
   */
  getDefaultValue: () => PortValue<T>

  /**
   * Clone a value of this type
   */
  clone: (value: PortValue<T>) => PortValue<T>
}

/**
 * Port type registry for managing port types
 */
export class PortTypeRegistry {
  private static handlers = new Map<PortType, PortTypeHandler<any>>()

  /**
   * Register a type handler
   */
  static register<T extends PortType>(
    type: T,
    handler: PortTypeHandler<T>,
  ): void {
    if (this.handlers.has(type)) {
      throw new Error(`Handler for type '${type}' is already registered`)
    }
    this.handlers.set(type, handler)
  }

  /**
   * Get a type handler
   */
  static getHandler<T extends PortType>(type: T): PortTypeHandler<T> {
    const handler = this.handlers.get(type)
    if (!handler) {
      throw new Error(`No handler registered for type '${type}'`)
    }
    return handler as PortTypeHandler<T>
  }

  /**
   * Check if a type is registered
   */
  static hasHandler(type: PortType): boolean {
    return this.handlers.has(type)
  }

  /**
   * Validate a value against a type
   */
  static validate<T extends PortType>(
    type: T,
    value: unknown,
  ): TypeValidationResult {
    return this.getHandler(type).validate(value)
  }

  /**
   * Convert a value to a type's format
   */
  static convert<T extends PortType>(
    type: T,
    value: unknown,
  ): PortValue<T> {
    return this.getHandler(type).convert(value)
  }

  /**
   * Get default value for a type
   */
  static getDefaultValue<T extends PortType>(type: T): PortValue<T> {
    return this.getHandler(type).getDefaultValue()
  }

  /**
   * Clone a value of a specific type
   */
  static cloneValue<T extends PortType>(
    type: T,
    value: PortValue<T>,
  ): PortValue<T> {
    return this.getHandler(type).clone(value)
  }
}

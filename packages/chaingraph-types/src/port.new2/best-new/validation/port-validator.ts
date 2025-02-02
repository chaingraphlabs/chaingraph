import type {
  ArrayPortConfig,
  ArrayPortValue,
  IPortConfig,
  IPortValue,
  NumberPortConfig,
  NumberPortValue,
  ObjectPortConfig,
  PortType,
  StringPortConfig,
  StringPortValue,
} from '../base/types'
import { z } from 'zod'
import {
  isArrayPortConfig,
  isNumberPortConfig,
  isObjectPortConfig,
  isStringPortConfig,
} from '../base/types'
import { validateObjectValue } from '../plugins/ObjectPortPlugin'
import { portRegistry } from '../registry/PortRegistry'

/**
 * Helper function to map Zod errors to ValidationErrorDetails format
 */
function mapZodErrors(
  issues: ReadonlyArray<z.ZodIssue>,
  basePath: (string | number)[] = [],
): { path: (string | number)[], message: string, code: z.ZodIssueCode }[] {
  return issues.map(issue => ({
    path: [...basePath, ...(issue.path as (string | number)[])],
    message: issue.message,
    code: issue.code,
  }))
}

/**
 * Validation error details
 */
interface ValidationErrorDetails {
  path: (string | number)[]
  message: string
  code: z.ZodIssueCode
}

/**
 * Validation result
 */
interface ValidationResult {
  success: boolean
  errors: ValidationErrorDetails[]
}

/**
 * Port validator class for centralized validation logic
 */
export class PortValidator {
  /**
   * Validate a port configuration and value together
   */
  validatePort(config: IPortConfig, value: IPortValue): ValidationResult {
    const errors: ValidationErrorDetails[] = []

    // Validate type matching
    if (config.type !== value.type) {
      errors.push({
        path: ['type'],
        message: `Value type "${value.type}" does not match config type "${config.type}"`,
        code: z.ZodIssueCode.invalid_type,
      })
      return { success: false, errors }
    }

    // Get plugin for validation
    const plugin = portRegistry.getPlugin(config.type as PortType)
    if (!plugin) {
      errors.push({
        path: ['type'],
        message: `Unknown port type: ${config.type}`,
        code: z.ZodIssueCode.invalid_type,
      })
      return { success: false, errors }
    }

    // Validate config and value using plugin schemas
    const configResult = plugin.configSchema.safeParse(config)
    const valueResult = plugin.valueSchema.safeParse(value)

    if (!configResult.success) {
      errors.push(...mapZodErrors(configResult.error.errors, ['config']))
    }

    if (!valueResult.success) {
      errors.push(...mapZodErrors(valueResult.error.errors, ['value']))
    }

    // Use plugin's validate method if available, otherwise fall back to type-specific validation
    if ('validate' in plugin && typeof plugin.validate === 'function') {
      const pluginErrors = plugin.validate(value as any, config as any)
      errors.push(...pluginErrors.map((err: string) => ({
        path: ['value'],
        message: err,
        code: z.ZodIssueCode.custom,
      })))
    } else {
      // Fallback to type-specific validations if plugin doesn't have validate method
      this.validateTypeSpecific(config, value, [], errors)
    }

    return {
      success: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate type-specific constraints
   */
  private validateTypeSpecific(
    config: IPortConfig,
    value: IPortValue,
    path: (string | number)[],
    errors: ValidationErrorDetails[],
  ): void {
    if (isStringPortConfig(config)) {
      if (value.type === 'string') {
        this.validateString(config, value, path, errors)
      }
    } else if (isNumberPortConfig(config)) {
      if (value.type === 'number') {
        this.validateNumber(config, value, path, errors)
      }
    } else if (isArrayPortConfig(config)) {
      if (value.type === 'array') {
        this.validateArray(config, value, path, errors)
      }
    } else if (isObjectPortConfig(config)) {
      if (value.type === 'object') {
        this.validateObject(config, value, path, errors)
      }
    }
  }

  /**
   * Validate object-specific constraints
   */
  private validateObject(
    config: ObjectPortConfig,
    value: IPortValue,
    path: (string | number)[],
    errors: ValidationErrorDetails[],
  ): void {
    // Use ObjectPortPlugin's validateObjectValue
    const objectErrors = validateObjectValue(value, config)

    // Convert error messages to ValidationErrorDetails
    objectErrors.forEach((errorMessage) => {
      // Extract field path from error message if it exists
      const fieldMatch = errorMessage.match(/field: ([^:]+):?/)
      const fieldPath = fieldMatch ? fieldMatch[1].split('.') : []

      errors.push({
        path: [...path, ...fieldPath],
        message: errorMessage,
        code: z.ZodIssueCode.custom,
      })
    })

    // Recursively validate nested fields
    if ('fields' in config && 'value' in value) {
      const objectValue = value.value as Record<string, IPortValue>
      const objectConfig = config.fields

      // Validate each field
      Object.entries(objectConfig).forEach(([key, fieldConfig]) => {
        const fieldValue = objectValue[key]
        if (fieldValue) {
          const fieldResult = this.validatePort(fieldConfig, fieldValue)
          if (!fieldResult.success) {
            errors.push(
              ...fieldResult.errors.map(err => ({
                ...err,
                path: [...path, 'value', key, ...err.path],
              })),
            )
          }
        }
      })
    }
  }

  /**
   * Validate string-specific constraints
   */
  private validateString(
    config: StringPortConfig,
    value: StringPortValue,
    path: (string | number)[],
    errors: ValidationErrorDetails[],
  ): void {
    const strValue = value.value
    if (config.minLength !== undefined && strValue.length < config.minLength) {
      errors.push({
        path: [...path, 'value'],
        message: `String must be at least ${config.minLength} characters long`,
        code: z.ZodIssueCode.too_small,
      })
    }

    if (config.maxLength !== undefined && strValue.length > config.maxLength) {
      errors.push({
        path: [...path, 'value'],
        message: `String must be at most ${config.maxLength} characters long`,
        code: z.ZodIssueCode.too_big,
      })
    }

    if (config.pattern !== undefined) {
      const regex = new RegExp(config.pattern)
      if (!regex.test(strValue)) {
        errors.push({
          path: [...path, 'value'],
          message: `String must match pattern: ${config.pattern}`,
          code: z.ZodIssueCode.invalid_string,
        })
      }
    }
  }

  /**
   * Validate number-specific constraints
   */
  private validateNumber(
    config: NumberPortConfig,
    value: NumberPortValue,
    path: (string | number)[],
    errors: ValidationErrorDetails[],
  ): void {
    const numValue = value.value
    if (config.min !== undefined && numValue < config.min) {
      errors.push({
        path: [...path, 'value'],
        message: `Value must be greater than or equal to ${config.min}`,
        code: z.ZodIssueCode.too_small,
      })
    }

    if (config.max !== undefined && numValue > config.max) {
      errors.push({
        path: [...path, 'value'],
        message: `Value must be less than or equal to ${config.max}`,
        code: z.ZodIssueCode.too_big,
      })
    }

    if (config.step !== undefined) {
      const offset = config.min !== undefined ? numValue - config.min : numValue
      if (offset % config.step !== 0) {
        errors.push({
          path: [...path, 'value'],
          message: `Value must be aligned with step ${config.step}`,
          code: z.ZodIssueCode.custom,
        })
      }
    }

    if (config.integer === true && !Number.isInteger(numValue)) {
      errors.push({
        path: [...path, 'value'],
        message: 'Value must be an integer',
        code: z.ZodIssueCode.custom,
      })
    }
  }

  /**
   * Validate array-specific constraints
   */
  private validateArray(
    config: ArrayPortConfig,
    value: ArrayPortValue,
    path: (string | number)[],
    errors: ValidationErrorDetails[],
  ): void {
    const arrayValue = value.value
    if (config.minLength !== undefined && arrayValue.length < config.minLength) {
      errors.push({
        path: [...path, 'value'],
        message: `Array must have at least ${config.minLength} items`,
        code: z.ZodIssueCode.too_small,
      })
    }

    if (config.maxLength !== undefined && arrayValue.length > config.maxLength) {
      errors.push({
        path: [...path, 'value'],
        message: `Array must have at most ${config.maxLength} items`,
        code: z.ZodIssueCode.too_big,
      })
    }

    // Recursively validate each array item
    arrayValue.forEach((item, index) => {
      const itemResult = this.validatePort(config.itemConfig, item)
      if (!itemResult.success) {
        errors.push(
          ...itemResult.errors.map(err => ({
            ...err,
            path: [...path, 'value', index, ...err.path],
          })),
        )
      }
    })
  }
}

/**
 * Global port validator instance
 */
export const portValidator = new PortValidator()

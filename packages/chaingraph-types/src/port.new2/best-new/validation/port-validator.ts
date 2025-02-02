import type { IPortConfig, IPortValue, PortType } from '../base/types'
import { z } from 'zod'
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

    // Ensure plugin has validate method
    if (typeof plugin.validate !== 'function') {
      throw new TypeError(`Plugin for type "${config.type}" must implement a validate method`)
    }

    // Use plugin's validate method
    const pluginErrors = plugin.validate(value as any, config as any)
    errors.push(...pluginErrors.map((err: string) => ({
      path: ['value'],
      message: err,
      code: z.ZodIssueCode.custom,
    })))

    return {
      success: errors.length === 0,
      errors,
    }
  }
}

/**
 * Global port validator instance
 */
export const portValidator = new PortValidator()

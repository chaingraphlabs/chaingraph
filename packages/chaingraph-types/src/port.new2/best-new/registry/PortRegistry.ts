import type { IPortPlugin } from '../base/types'
import { z } from 'zod'
import { PortError, PortErrorType } from '../base/types'

type DiscriminatedSchema = z.ZodObject<{
  type: z.ZodLiteral<string>
  [key: string]: z.ZodTypeAny
}>

type UnionSchemas = z.ZodDiscriminatedUnion<'type', [DiscriminatedSchema, ...DiscriminatedSchema[]]>

interface ValidationError {
  path: (string | number)[]
  message: string
  code: z.ZodIssueCode
}

/**
 * Registry for managing port plugins
 */
export class PortRegistry {
  private static instance: PortRegistry
  private plugins = new Map<string, IPortPlugin>()
  private unionSchemas: {
    config: UnionSchemas | null
    value: UnionSchemas | null
  } = {
      config: null,
      value: null,
    }

  private constructor() {
    // Private constructor to enforce singleton
    // Bind methods to ensure 'this' context
    this.isZodObject = this.isZodObject.bind(this)
    this.hasTypeLiteral = this.hasTypeLiteral.bind(this)
  }

  /**
   * Get the singleton instance of PortRegistry
   */
  public static getInstance(): PortRegistry {
    if (!PortRegistry.instance) {
      PortRegistry.instance = new PortRegistry()
    }
    return PortRegistry.instance
  }

  /**
   * Register a new port plugin
   * @throws {PortError} if plugin with same typeIdentifier already exists
   */
  public register(plugin: IPortPlugin): void {
    if (this.plugins.has(plugin.typeIdentifier)) {
      throw new PortError(
        PortErrorType.RegistryError,
        `Plugin with typeIdentifier "${plugin.typeIdentifier}" is already registered`,
      )
    }

    // Validate plugin has required schemas
    if (!plugin.configSchema || !plugin.valueSchema) {
      throw new PortError(
        PortErrorType.RegistryError,
        `Plugin "${plugin.typeIdentifier}" must provide both configSchema and valueSchema`,
      )
    }

    // Check if schemas are ZodObject type (either directly or through metadata)
    if (!this.isZodObject(plugin.configSchema)) {
      throw new PortError(
        PortErrorType.RegistryError,
        `Plugin "${plugin.typeIdentifier}" config schema must be a ZodObject`,
      )
    }

    if (!this.isZodObject(plugin.valueSchema)) {
      throw new PortError(
        PortErrorType.RegistryError,
        `Plugin "${plugin.typeIdentifier}" value schema must be a ZodObject`,
      )
    }

    // Validate schemas have the correct shape
    if (!this.hasTypeLiteral(plugin.configSchema)) {
      throw new PortError(
        PortErrorType.RegistryError,
        `Plugin "${plugin.typeIdentifier}" config schema must have a 'type' literal field`,
      )
    }

    if (!this.hasTypeLiteral(plugin.valueSchema)) {
      throw new PortError(
        PortErrorType.RegistryError,
        `Plugin "${plugin.typeIdentifier}" value schema must have a 'type' literal field`,
      )
    }

    this.plugins.set(plugin.typeIdentifier, plugin)

    // Reset cached union schemas since we have a new plugin
    this.unionSchemas.config = null
    this.unionSchemas.value = null
  }

  private isZodObject(schema: z.ZodTypeAny): schema is z.ZodObject<any> {
    // Check if it's directly a ZodObject
    if (schema instanceof z.ZodObject) {
      return true
    }

    // Handle refined schemas
    if (schema instanceof z.ZodEffects && schema._def.schema instanceof z.ZodObject) {
      return true
    }

    return false
  }

  private getBaseSchema(schema: z.ZodTypeAny): z.ZodObject<any> | null {
    if (schema instanceof z.ZodObject) {
      return schema
    }

    // Handle refined schemas
    if (schema instanceof z.ZodEffects && schema._def.schema instanceof z.ZodObject) {
      return schema._def.schema
    }

    return null
  }

  private hasTypeLiteral(schema: z.ZodTypeAny): boolean {
    const baseSchema = this.getBaseSchema(schema)
    if (!baseSchema)
      return false

    return 'shape' in baseSchema
      && 'type' in baseSchema.shape
      && baseSchema.shape.type instanceof z.ZodLiteral
  }

  /**
   * Build a discriminated union schema from a list of plugins
   * @param schemas List of Zod schemas to build union from
   * @returns Discriminated union schema
   * @throws {PortError} if no valid schemas are provided
   */
  private buildUnionSchema(schemas: z.ZodTypeAny[]): UnionSchemas {
    const validSchemas = schemas
      .filter(this.isZodObject)
      .filter(this.hasTypeLiteral)
      .map(schema => this.getBaseSchema(schema))
      .filter((schema): schema is z.ZodObject<any> => schema !== null)

    if (validSchemas.length === 0) {
      throw new PortError(
        PortErrorType.RegistryError,
        'No valid schemas provided - cannot create union schema',
      )
    }

    const [first, ...rest] = validSchemas
    return z.discriminatedUnion('type', [first, ...rest]) as UnionSchemas
  }

  /**
   * Get a plugin by its type identifier
   */
  public getPlugin(typeIdentifier: string): IPortPlugin | undefined {
    return this.plugins.get(typeIdentifier)
  }

  /**
   * Get all registered plugins
   */
  public getAllPlugins(): IPortPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Build discriminated union schema for all registered plugin configs
   * @throws {PortError} if no plugins are registered
   */
  public getConfigUnionSchema(): UnionSchemas {
    if (!this.unionSchemas.config) {
      const schemas = Array.from(this.plugins.values())
        .map(p => p.configSchema)
      this.unionSchemas.config = this.buildUnionSchema(schemas)
    }
    return this.unionSchemas.config
  }

  /**
   * Build discriminated union schema for all registered plugin values
   * @throws {PortError} if no plugins are registered
   */
  public getValueUnionSchema(): UnionSchemas {
    if (!this.unionSchemas.value) {
      const schemas = Array.from(this.plugins.values())
        .map(p => p.valueSchema)
      this.unionSchemas.value = this.buildUnionSchema(schemas)
    }
    return this.unionSchemas.value
  }

  /**
   * Convert Zod validation errors to our ValidationError format
   */
  private formatValidationErrors(errors: z.ZodError): ValidationError[] {
    return errors.errors.map(err => ({
      path: err.path,
      message: err.message,
      code: err.code,
    }))
  }

  /**
   * Validate a port configuration
   * @param config Port configuration to validate
   * @returns Array of validation errors, empty if valid
   */
  public validateConfig(config: unknown): ValidationError[] {
    const result = this.getConfigUnionSchema().safeParse(config)
    if (!result.success) {
      return this.formatValidationErrors(result.error)
    }
    return []
  }

  /**
   * Validate a port value
   * @param value Port value to validate
   * @returns Array of validation errors, empty if valid
   */
  public validateValue(value: unknown): ValidationError[] {
    const result = this.getValueUnionSchema().safeParse(value)
    if (!result.success) {
      return this.formatValidationErrors(result.error)
    }
    return []
  }

  /**
   * Clear all registered plugins and cached schemas
   */
  public clear(): void {
    this.plugins.clear()
    this.unionSchemas.config = null
    this.unionSchemas.value = null
  }
}

// Export a singleton instance
export const portRegistry = PortRegistry.getInstance()

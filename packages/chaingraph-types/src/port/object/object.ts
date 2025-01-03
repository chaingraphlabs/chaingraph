import type { IPort } from '../interface'
import type { PortConfig } from '../types'
import type { ObjectPortConfig, ObjectSchema } from './types'

export class ObjectPort implements IPort<Record<string, unknown>> {
  readonly config: PortConfig
  private readonly schema: ObjectSchema
  private values: Record<string, unknown>

  constructor(config: ObjectPortConfig) {
    this.config = {
      ...config,
      type: 'object',
    }
    this.schema = config.schema
    this.values = config.defaultValue ?? {}
  }

  // Add this getter to comply with IPort interface
  get value(): Record<string, unknown> {
    return { ...this.values }
  }

  getValue(): Record<string, unknown> {
    return { ...this.values }
  }

  setValue(value: Record<string, unknown>): void {
    // Validate value against schema
    this.validateValue(value)

    // Update values
    this.values = { ...value }
  }

  /**
   * Get a field value
   */
  getFieldValue(fieldName: string): unknown {
    return this.values[fieldName]
  }

  /**
   * Set a field value
   */
  setFieldValue(fieldName: string, value: unknown): void {
    if (!this.schema.fields.has(fieldName)) {
      throw new Error(`Field ${fieldName} does not exist`)
    }

    const newValues = { ...this.values, [fieldName]: value }
    this.validateValue(newValues)
    this.values = newValues
  }

  /**
   * Add a new field to the object schema
   */
  addField(fieldName: string, config: PortConfig): void {
    if (this.schema.fields.has(fieldName)) {
      throw new Error(`Field ${fieldName} already exists`)
    }

    this.schema.fields.set(fieldName, config)
    this.values[fieldName] = config.defaultValue
  }

  /**
   * Remove a field from the object schema
   */
  removeField(fieldName: string): void {
    if (!this.schema.fields.has(fieldName)) {
      throw new Error(`Field ${fieldName} does not exist`)
    }

    this.schema.fields.delete(fieldName)
    delete this.values[fieldName]
  }

  async validate(): Promise<boolean> {
    try {
      this.validateValue(this.values)
      return true
    } catch {
      return false
    }
  }

  reset(): void {
    this.values = (this.config as ObjectPortConfig).defaultValue ?? {}
  }

  hasValue(): boolean {
    return Object.keys(this.values).length > 0
  }

  clone(): IPort<Record<string, unknown>> {
    return new ObjectPort({
      ...(this.config as ObjectPortConfig),
      defaultValue: { ...this.values },
    })
  }

  /**
   * Get field names in order
   */
  getFieldNames(): string[] {
    return Array.from(this.schema.fields.order)
  }

  /**
   * Get current schema
   */
  getSchema(): ObjectSchema {
    return this.schema
  }

  /**
   * Check if field exists
   */
  hasField(fieldName: string): boolean {
    return this.schema.fields.has(fieldName)
  }

  /**
   * Get field configuration
   */
  getFieldConfig(fieldName: string): PortConfig | undefined {
    return this.schema.fields.get(fieldName)
  }

  private validateValue(value: Record<string, unknown>): void {
    // Check required fields
    for (const [fieldName, fieldConfig] of this.schema.fields.entries()) {
      if (fieldConfig.required && !(fieldName in value)) {
        throw new Error(`Missing required field: ${fieldName}`)
      }
    }

    // Validate field values
    for (const [fieldName, fieldValue] of Object.entries(value)) {
      const fieldConfig = this.schema.fields.get(fieldName)
      if (!fieldConfig) {
        throw new Error(`Unknown field: ${fieldName}`)
      }

      // TODO: Add type validation for field values
      // This will need to validate based on fieldConfig.type
    }
  }
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArrayPortConfig,
  BooleanPortConfig,
  EnumPortConfig,
  IPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  StringPortConfig,
} from '../base/types'

import type {
  JsonSchema7ArrayType,
  JsonSchema7BooleanType,
  JsonSchema7EnumType,
  JsonSchema7LiteralType,
  JsonSchema7Meta,
  JsonSchema7NumberType,
  JsonSchema7ObjectType,
  JsonSchema7StringType,
  JsonSchema7Type,
} from './json-schema-types'

export function jsonSchemaToPortConfig(
  key: string,
  schema: JsonSchema7Type | any,
  parentRequired?: string[],
  order?: number,
): IPortConfig {
  const isRequired = parentRequired?.includes(key) || false
  const baseConfig = {
    key,
    title: schema.title || key,
    description: schema.description || '',
    required: isRequired,
    ui: {
      hideEditor: false,
    }, // as BasePortConfigUIType,
    order: order ?? 0,
  }

  if (isEnumType(schema)) {
    const options: IPortConfig[] = schema.enum.map((value: any, index: number) => ({
      id: value,
      key: String(value),
      title: String(value),
      type: typeof value === 'string'
        ? 'string'
        : typeof value === 'number'
          ? 'number'
          : typeof value === 'boolean' ? 'boolean' : 'string',
      defaultValue: value,
      order: index,
    } as IPortConfig))

    return {
      ...baseConfig,
      type: 'enum',
      defaultValue: schema.default ?? schema.enum[0],
      options,
    } as EnumPortConfig
  }

  if (isStringType(schema)) {
    return {
      ...baseConfig,
      type: 'string',
      defaultValue: schema.default ?? '',
      minLength: schema.minLength,
      maxLength: schema.maxLength,
      pattern: schema.pattern,
      ui: {
        ...baseConfig.ui,
        isTextArea: true,
      },
    } as StringPortConfig
  }

  if (isNumberType(schema)) {
    const isInteger = schema.type === 'integer'
    return {
      ...baseConfig,
      type: 'number',
      defaultValue: schema.default ?? 0,
      min: schema.minimum,
      max: schema.maximum,
      step: isInteger ? 1 : undefined,
      integer: isInteger,
    } as NumberPortConfig
  }

  if (isBooleanType(schema)) {
    return {
      ...baseConfig,
      type: 'boolean',
      defaultValue: schema.default ?? false,
    } as BooleanPortConfig
  }

  if (isArrayType(schema)) {
    const itemSchema = schema.items || { type: 'string' }
    return {
      ...baseConfig,
      type: 'array',
      defaultValue: schema.default ?? [],
      itemConfig: jsonSchemaToPortConfig('item', itemSchema),
      minLength: schema.minItems,
      maxLength: schema.maxItems,
      isMutable: true,
      ui: {
        ...baseConfig.ui,
        itemDeletable: true,
      },
    } as ArrayPortConfig
  }

  if (isObjectType(schema)) {
    const properties: Record<string, IPortConfig> = {}

    if (schema.properties) {
      let orderIndex = 0
      for (const [propKey, propSchema] of Object.entries(schema.properties)) {
        properties[propKey] = jsonSchemaToPortConfig(
          propKey,
          propSchema,
          schema.required,
          orderIndex++,
        )
      }
    }

    return {
      ...baseConfig,
      type: 'object',
      defaultValue: schema.default ?? {},
      schema: {
        properties,
      },
      isSchemaMutable: !properties || Object.keys(properties).length === 0,
      ui: {
        ...baseConfig.ui,
        isObjectEditor: true,
      },
    } as ObjectPortConfig
  }

  if (isLiteralType(schema) && 'const' in schema) {
    const literalValue = schema.const
    const literalType = typeof literalValue === 'string'
      ? 'string'
      : typeof literalValue === 'number'
        ? 'number'
        : typeof literalValue === 'boolean' ? 'boolean' : 'string'

    return {
      ...baseConfig,
      type: literalType,
      defaultValue: literalValue,
      ui: {
        ...baseConfig.ui,
        readOnly: true,
      },
    } as IPortConfig
  }

  return {
    ...baseConfig,
    type: 'string',
    defaultValue: schema.default ?? '',
  } as StringPortConfig
}

function isStringType(schema: any): schema is JsonSchema7StringType & JsonSchema7Meta {
  return schema?.type === 'string'
}

function isNumberType(schema: any): schema is JsonSchema7NumberType & JsonSchema7Meta {
  return schema?.type === 'number' || schema?.type === 'integer'
}

function isBooleanType(schema: any): schema is JsonSchema7BooleanType & JsonSchema7Meta {
  return schema?.type === 'boolean'
}

function isArrayType(schema: any): schema is JsonSchema7ArrayType & JsonSchema7Meta {
  return schema?.type === 'array'
}

function isObjectType(schema: any): schema is JsonSchema7ObjectType & JsonSchema7Meta {
  return schema?.type === 'object'
}

function isEnumType(schema: any): schema is JsonSchema7EnumType & JsonSchema7Meta {
  return Array.isArray(schema?.enum)
}

function isLiteralType(schema: any): schema is JsonSchema7LiteralType & JsonSchema7Meta {
  return schema?.const !== undefined
}

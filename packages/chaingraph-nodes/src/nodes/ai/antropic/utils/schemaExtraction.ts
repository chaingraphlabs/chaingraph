/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort } from '@badaitech/chaingraph-types'
import {
  isAnyPortConfig,
  isArrayPortConfig,
  isBooleanPortConfig,
  isEnumPortConfig,
  isNumberPortConfig,
  isObjectPortConfig,
  isStringPortConfig,
} from '@badaitech/chaingraph-types'

export interface ExtractedSchema {
  properties: Record<string, any>
  required: string[]
  outputProperties: Record<string, any>
  outputRequired: string[]
  metadata: {
    nodeTitle: string
    nodeDescription?: string
    originalNodeId: string
    originalNodeType: string
    extractedAt: string
  }
}

export interface SchemaProperty {
  type?: string
  title?: string
  description?: string
  default?: any
  properties?: Record<string, SchemaProperty>
  items?: SchemaProperty
  // String properties
  minLength?: number
  maxLength?: number
  pattern?: string
  // Number properties
  minimum?: number
  maximum?: number
  multipleOf?: number
  // Array properties
  minItems?: number
  maxItems?: number
  // Enum properties
  enum?: string[]
  enumTitles?: string[]
  // Object-level required (for object types only)
  required?: string[]
}

/**
 * Extracts input and output schema from a node for tool definition
 * Converts node's input and output ports to JSON schema format
 */
export function extractNodeSchema(node: INode): ExtractedSchema {
  // Get all ports from the node
  const allPorts = Array.from(node.ports.values())
    .filter(port => !port.getConfig().parentId) // Only root-level ports

  // Separate input and output ports
  const inputPorts = allPorts.filter(port => port.getConfig().direction === 'input')
  const outputPorts = allPorts.filter(port => port.getConfig().direction === 'output')

  // Process input ports
  const properties: Record<string, SchemaProperty> = {}
  const required: string[] = []

  for (const port of inputPorts) {
    const config = port.getConfig()
    const key = config.key || port.id

    // Skip hidden ports
    if (isNeedsToSkipPort(port)) {
      continue
    }

    // Extract schema property from port
    properties[key] = portConfigToJsonSchema(port)

    // Add to required if marked as required
    if (config.required) {
      required.push(key)
    }
  }

  // Process output ports
  const outputProperties: Record<string, SchemaProperty> = {}
  const outputRequired: string[] = []

  for (const port of outputPorts) {
    const config = port.getConfig()
    const key = config.key || port.id

    if (isNeedsToSkipPort(port)) {
      continue
    }

    // Extract schema property from port
    outputProperties[key] = portConfigToJsonSchema(port)

    // Add to required if marked as required
    if (config.required) {
      outputRequired.push(key)
    }
  }

  return {
    properties,
    required,
    outputProperties,
    outputRequired,
    metadata: {
      nodeTitle: node.metadata.title || 'Untitled Node',
      nodeDescription: node.metadata.description,
      originalNodeId: node.id,
      originalNodeType: node.metadata.type,
      extractedAt: new Date().toISOString(),
    },
  }
}

export function isNeedsToSkipPort(port: IPort): boolean {
  if (port.getConfig().connections && (port.getConfig().connections?.length || 0) > 0) {
    // Skip ports that are connected to other ports
    return true
  }

  if (port.getConfig().type === 'string') {
    if (port.getValue() !== undefined && port.getValue() !== null && port.getValue() !== '') {
      // Skip string properties that are not empty
      return true
    }
  } else if (port.getConfig().type === 'number') {
    if (port.getValue() !== undefined && port.getValue() !== null && port.getValue() !== 0) {
      // Skip number properties that are not null or undefined
      return true
    }
  }

  // Skip ports that are connected to other ports
  if (port.getConfig().connections && (port.getConfig().connections?.length || 0) > 0) {
    return true
  }

  // Skip ports that are hidden
  if (port.getConfig().ui?.hidden) {
    return true
  }

  // Skip system ports
  if (port.getConfig().metadata?.isSystemPort) {
    return true
  }

  return false
}

/**
 * Converts a port configuration to JSON schema format
 */
export function portConfigToJsonSchema(port: IPort): SchemaProperty {
  const config = port.getConfig()

  // Base properties all ports have
  const baseProperty: SchemaProperty = {
    title: config.title || port.id,
    description: config.description || config.title || '',
    enum: undefined,
  }

  // Add default value if present
  if (config.defaultValue !== undefined && config.defaultValue !== null && config.defaultValue !== '') {
    baseProperty.default = config.defaultValue
  }

  // Handle different port types
  if (isStringPortConfig(config)) {
    return {
      ...baseProperty,
      type: 'string',
      ...(config.minLength !== undefined && { minLength: config.minLength }),
      ...(config.maxLength !== undefined && { maxLength: config.maxLength }),
      ...(config.pattern && { pattern: config.pattern }),
    }
  }

  if (isNumberPortConfig(config)) {
    return {
      ...baseProperty,
      type: config.integer ? 'integer' : 'number',
      ...(config.min !== undefined && { minimum: config.min }),
      ...(config.max !== undefined && { maximum: config.max }),
      ...(config.step !== undefined && { multipleOf: config.step }),
    }
  }

  if (isBooleanPortConfig(config)) {
    return {
      ...baseProperty,
      type: 'boolean',
    }
  }

  if (isEnumPortConfig(config)) {
    const enumValues = config.options.map(option => option.defaultValue || option.id).filter((id): id is string => Boolean(id))
    const enumTitles = config.options.map(option => option.title || option.defaultValue || option.id).filter((title): title is string => Boolean(title))

    const res = {
      ...baseProperty,
      type: 'string',
    }

    if (enumValues.length > 0) {
      res.enum = enumValues
      res.enumTitles = enumTitles
    }
  }

  if (isArrayPortConfig(config)) {
    // For arrays, we need to process the item type recursively
    // Create a mock port for the item config to process it
    const itemProperty = processItemConfig(config.itemConfig)

    return {
      ...baseProperty,
      type: 'array',
      items: itemProperty,
      ...(config.minLength !== undefined && { minItems: config.minLength }),
      ...(config.maxLength !== undefined && { maxItems: config.maxLength }),
    }
  }

  if (isObjectPortConfig(config)) {
    return processObjectPort(port)
  }

  if (isAnyPortConfig(config)) {
    // For any type, we can return a generic object schema
    return {
      ...baseProperty,
      type: 'any',
    }
  }

  // Fallback for any unknown types
  return baseProperty
}

/**
 * Helper function to process item configs for arrays
 */
function processItemConfig(itemConfig: any): SchemaProperty {
  // For basic item configs, create a simple schema property
  if (typeof itemConfig === 'object' && itemConfig.type) {
    return {
      type: itemConfig.type,
      description: itemConfig.description || '',
      ...(itemConfig.defaultValue !== undefined && { defaultValue: itemConfig.defaultValue }),
    }
  }

  // Default fallback
  return {
    type: 'string',
    description: 'Array item',
  }
}

/**
 * Processes an object port recursively
 */
export function processObjectPort(port: IPort): SchemaProperty {
  const config = port.getConfig()

  if (!isObjectPortConfig(config)) {
    return {
      type: 'object',
      description: config.description || config.title || '',
      properties: {},
    }
  }

  const properties: Record<string, SchemaProperty> = {}
  const required: string[] = []

  // Process each property in the object schema
  if (config.schema?.properties) {
    for (const [key, propConfig] of Object.entries(config.schema.properties)) {
      // For basic property configs, create schema properties directly
      properties[key] = {
        type: propConfig.type || 'string',
        description: propConfig.description || propConfig.title || '',
        ...(propConfig.defaultValue !== undefined && { defaultValue: propConfig.defaultValue }),
      }

      if (propConfig.required) {
        required.push(key)
      }
    }
  }

  return {
    type: 'object',
    description: config.description || config.title || '',
    properties,
    ...(required.length > 0 && { required }),
  }
}

/**
 * Processes an array port
 */
export function processArrayPort(port: IPort): SchemaProperty {
  const config = port.getConfig()

  if (!isArrayPortConfig(config)) {
    return {
      type: 'array',
      description: config.description || config.title || '',
      items: {
        type: 'string',
      },
    }
  }

  // Process the item configuration
  const itemProperty = processItemConfig(config.itemConfig)

  return {
    type: 'array',
    description: config.description || config.title || '',
    items: itemProperty,
    ...(config.minLength !== undefined && { minItems: config.minLength }),
    ...(config.maxLength !== undefined && { maxItems: config.maxLength }),
  }
}

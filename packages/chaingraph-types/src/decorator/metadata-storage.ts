/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import 'reflect-metadata'

const NODE_METADATA_KEY = 'chaingraph:node-config'
const PORTS_METADATA_KEY = 'chaingraph:ports-config'
const OBJECT_SCHEMA_METADATA_KEY = 'chaingraph:object-schema'

/**
 * NODE METADATA STORAGE FUNCTIONS
 */
export function getNodeMetadata(target: any): Record<string, any> {
  return Reflect.getMetadata(NODE_METADATA_KEY, target) || { type: target.name }
}

export function setNodeMetadata(target: any, metadata: Record<string, any>): void {
  Reflect.defineMetadata(NODE_METADATA_KEY, metadata, target)
}

export function updateNodeMetadata(target: any, partialMetadata: Record<string, any>): void {
  const current = getNodeMetadata(target)
  const updated = { ...current, ...partialMetadata }
  setNodeMetadata(target, updated)
}

/**
 * PORT METADATA STORAGE FUNCTIONS
 */
export function getPortsMetadata(target: any): Map<string | symbol, any> {
  return Reflect.getMetadata(PORTS_METADATA_KEY, target) || new Map()
}

export function setPortsMetadata(target: any, ports: Map<string | symbol, any>): void {
  Reflect.defineMetadata(PORTS_METADATA_KEY, ports, target)
}

export function getPortMetadata(target: any, propertyKey: string | symbol): Record<string, any> {
  const ports = getPortsMetadata(target)
  return ports.get(propertyKey) || {}
}

export function setPortMetadata(target: any, propertyKey: string | symbol, metadata: Record<string, any>): void {
  const ports = getPortsMetadata(target)
  ports.set(propertyKey, metadata)
  setPortsMetadata(target, ports)
}

export function updatePortMetadata(target: any, propertyKey: string | symbol, partial: Record<string, any>): void {
  const current = getPortMetadata(target, propertyKey)
  const updated = { ...current, ...partial }
  setPortMetadata(target, propertyKey, updated)
}

/**
 * OBJECT SCHEMA METADATA STORAGE FUNCTIONS
 */

/**
 * Retrieves the object schema metadata from the target.
 */
export function getObjectSchemaMetadata(target: any): any {
  return Reflect.getMetadata(OBJECT_SCHEMA_METADATA_KEY, target)
}

/**
 * Stores the object schema metadata on the target.
 */
export function setObjectSchemaMetadata(target: any, schema: any): void {
  Reflect.defineMetadata(OBJECT_SCHEMA_METADATA_KEY, schema, target)
}

/**
 * Updates the object schema metadata on the target by merging with the provided partial schema.
 */
export function updateObjectSchemaMetadata(target: any, partial: any): void {
  const current = getObjectSchemaMetadata(target) || {}
  const updated = { ...current, ...partial }
  setObjectSchemaMetadata(target, updated)
}

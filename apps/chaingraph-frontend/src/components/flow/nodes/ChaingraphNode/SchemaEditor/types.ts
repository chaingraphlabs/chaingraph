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
    INode,
    IObjectSchema,
    IPortConfig,
    NumberPortConfig,
    ObjectPortConfig,
    PortType,
    StringPortConfig
} from '@badaitech/chaingraph-types'

/**
 * Props for the SchemaEditor component
 */
export interface SchemaEditorProps {
    /** Initial port configuration to edit */
    initialConfig?: IPortConfig
    /** Called when the schema is saved/updated */
    onSave: (config: IPortConfig) => void
    /** Optional title for the editor */
    title?: string
    /** Which port type to show by default */
    defaultType?: PortType
    /** Control whether the editor can be closed */
    allowClose?: boolean
    /** Called when the editor is closed without saving */
    onCancel?: () => void
}

/**
 * Context for the Schema Editor component tree
 */
export interface SchemaEditorContextValue {
    /** The current virtual node used for schema editing */
    node: INode
    /** Update the virtual node */
    updateNode: (node: INode) => void
    /** Get a port by ID */
    getPortById: (id: string) => IPortConfig | undefined
    /** Add a new port */
    addPort: (port: IPortConfig) => void
    /** Remove a port by ID */
    removePort: (id: string) => void
    /** Update an existing port */
    updatePort: (port: IPortConfig) => void
    /** Get the main schema port ID */
    getSchemaPortId: () => string
}

/**
 * Props for the property editor
 */
export interface PropertyEditorProps {
    /** The property key */
    propertyKey: string
    /** The property configuration */
    config: IPortConfig
    /** Called when the property is updated */
    onChange: (key: string, config: IPortConfig) => void
    /** Called when the property is removed */
    onRemove: (key: string) => void
    /** Whether the property can be removed */
    canRemove?: boolean
    /** Whether the key can be edited */
    canEditKey?: boolean
}

/**
 * Type guards for port configuration types
 */
export function isStringPortConfig(config: IPortConfig): config is StringPortConfig {
    return config.type === 'string'
}

export function isNumberPortConfig(config: IPortConfig): config is NumberPortConfig {
    return config.type === 'number'
}

export function isBooleanPortConfig(config: IPortConfig): config is BooleanPortConfig {
    return config.type === 'boolean'
}

export function isArrayPortConfig(config: IPortConfig): config is ArrayPortConfig {
    return config.type === 'array'
}

export function isObjectPortConfig(config: IPortConfig): config is ObjectPortConfig {
    return config.type === 'object'
}

export function isEnumPortConfig(config: IPortConfig): config is EnumPortConfig {
    return config.type === 'enum'
}
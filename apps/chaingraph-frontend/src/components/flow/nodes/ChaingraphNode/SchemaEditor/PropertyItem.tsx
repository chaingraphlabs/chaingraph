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
  PortType,
  StringPortConfig,
} from '@badaitech/chaingraph-types'
import type { PropertyEditorProps } from './types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { PORT_TYPES } from '@badaitech/chaingraph-types'
import {
  AlignLeft,
  ChevronDown,
  ChevronRight,
  Edit,
  Hash,
  Layers,
  List,
  Settings,
  ToggleLeft,
  Trash2,
  Type,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  isArrayPortConfig,
  isNumberPortConfig,
  isObjectPortConfig,
  isStringPortConfig,
} from './types'
// These components will be created next
// import { ObjectPropertyEditor } from './ObjectPropertyEditor'
// import { ArrayItemEditor } from './ArrayItemEditor'

/**
 * PropertyItem is a component for editing a property in a schema.
 * It handles rendering different editors based on the property type.
 */
export function PropertyItem({
  propertyKey,
  config = {} as IPortConfig,
  onChange,
  onRemove,
  canRemove = true,
  canEditKey = true,
}: PropertyEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editedKey, setEditedKey] = useState(propertyKey)
  const [isEditingKey, setIsEditingKey] = useState(false)

  // Reset the edited key when the property key changes
  useEffect(() => {
    setEditedKey(propertyKey)
  }, [propertyKey])

  // Handle saving the key edit
  const handleKeyEditSave = useCallback(() => {
    if (editedKey && editedKey !== propertyKey) {
      onChange(editedKey, config)
      onRemove(propertyKey)
    }
    setIsEditingKey(false)
  }, [editedKey, propertyKey, config, onChange, onRemove])

  // Handle changing the property type
  const handleTypeChange = useCallback((newType: PortType) => {
    // Preserve common properties
    const baseConfig = {
      title: config.title || editedKey,
      description: config.description || '',
      id: config.id,
      nodeId: config.nodeId,
    }

    // Create new config based on type
    let newConfig: IPortConfig

    switch (newType) {
      case 'string':
        newConfig = {
          ...baseConfig,
          type: 'string',
        } as StringPortConfig
        break

      case 'number':
        newConfig = {
          ...baseConfig,
          type: 'number',
        } as NumberPortConfig
        break

      case 'boolean':
        newConfig = {
          ...baseConfig,
          type: 'boolean',
        } as BooleanPortConfig
        break

      case 'object':
        newConfig = {
          ...baseConfig,
          type: 'object',
          schema: {
            properties: {},
            type: 'object' as const,
            description: 'Object Schema',
          },
          isSchemaMutable: true,
        } as ObjectPortConfig
        break

      case 'array':
        newConfig = {
          ...baseConfig,
          type: 'array',
          itemConfig: {
            type: 'string',
            title: 'Item',
          },
          isMutable: true,
        } as ArrayPortConfig
        break

      case 'enum':
        newConfig = {
          ...baseConfig,
          type: 'enum',
          options: [
            { type: 'string', title: 'Option 1' },
            { type: 'string', title: 'Option 2' },
          ],
        } as EnumPortConfig
        break

      default:
        newConfig = {
          ...baseConfig,
          type: 'string',
        } as StringPortConfig
    }

    onChange(propertyKey, newConfig)
    setIsExpanded(true)
  }, [config, editedKey, propertyKey, onChange])

  // Get the appropriate icon for the property type
  const typeIcon = useMemo(() => {
    switch (config.type) {
      case 'string':
        return <Type className="h-4 w-4" />
      case 'number':
        return <Hash className="h-4 w-4" />
      case 'boolean':
        return <ToggleLeft className="h-4 w-4" />
      case 'object':
        return <Layers className="h-4 w-4" />
      case 'array':
        return <List className="h-4 w-4" />
      case 'enum':
        return <AlignLeft className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }, [config.type])

  // Return early if no config is provided
  if (!config || !config.type) {
    return null
  }

  return (
    <Card className="mb-2 border-l-4 overflow-hidden" style={{ borderLeftColor: getTypeColor(config.type) }}>
      <CardHeader className="px-4 py-2 flex flex-row items-center space-y-0 gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 flex-1 text-left"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}

          {isEditingKey
            ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editedKey}
                    onChange={e => setEditedKey(e.target.value)}
                    className="h-7 text-sm w-[150px]"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleKeyEditSave()}
                    onBlur={handleKeyEditSave}
                  />
                </div>
              )
            : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 font-medium text-sm">
                    <span>{propertyKey}</span>
                    {canEditKey && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsEditingKey(true)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {typeIcon}
                    <span>{config.type}</span>
                  </div>
                </div>
              )}
        </button>

        <div className="flex items-center gap-1">
          <Select
            value={config.type}
            onValueChange={handleTypeChange}
            onOpenChange={e => e && setIsExpanded(true)}
          >
            <SelectTrigger className="h-7 text-xs w-[100px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {PORT_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    <span className="capitalize">{type}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => onRemove(propertyKey)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <div className={cn('border-t')}>
          <CardContent className="p-3 pt-3">
            {/* Common property fields */}
            <div className="grid gap-3 mb-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`${config.id}-title`} className="text-xs">
                    Title
                  </Label>
                  <Input
                    id={`${config.id}-title`}
                    value={config.title || ''}
                    onChange={e => onChange(propertyKey, { ...config, title: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="Title"
                  />
                </div>
                <div>
                  <Label htmlFor={`${config.id}-description`} className="text-xs">
                    Description
                  </Label>
                  <Input
                    id={`${config.id}-description`}
                    value={config.description || ''}
                    onChange={e => onChange(propertyKey, { ...config, description: e.target.value })}
                    className="h-8 text-sm"
                    placeholder="Description"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`${config.id}-required`}
                  checked={config.required || false}
                  onCheckedChange={checked =>
                    onChange(propertyKey, { ...config, required: checked })}
                />
                <Label htmlFor={`${config.id}-required`} className="text-xs">
                  Required
                </Label>
              </div>
            </div>

            {/* Type-specific fields */}
            {isStringPortConfig(config) && (
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`${config.id}-minLength`} className="text-xs">
                      Min Length
                    </Label>
                    <Input
                      id={`${config.id}-minLength`}
                      type="number"
                      value={config.minLength?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number.parseInt(e.target.value) : undefined
                        onChange(propertyKey, { ...config, minLength: val })
                      }}
                      className="h-8 text-sm"
                      placeholder="Min length"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${config.id}-maxLength`} className="text-xs">
                      Max Length
                    </Label>
                    <Input
                      id={`${config.id}-maxLength`}
                      type="number"
                      value={config.maxLength?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number.parseInt(e.target.value) : undefined
                        onChange(propertyKey, { ...config, maxLength: val })
                      }}
                      className="h-8 text-sm"
                      placeholder="Max length"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`${config.id}-isTextArea`}
                    checked={config.ui?.isTextArea || false}
                    onCheckedChange={checked =>
                      onChange(propertyKey, {
                        ...config,
                        ui: { ...config.ui, isTextArea: checked },
                      })}
                  />
                  <Label htmlFor={`${config.id}-isTextArea`} className="text-xs">
                    Multiline Text
                  </Label>
                </div>
              </div>
            )}

            {isNumberPortConfig(config) && (
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`${config.id}-min`} className="text-xs">
                      Min Value
                    </Label>
                    <Input
                      id={`${config.id}-min`}
                      type="number"
                      value={config.min?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number.parseFloat(e.target.value) : undefined
                        onChange(propertyKey, { ...config, min: val })
                      }}
                      className="h-8 text-sm"
                      placeholder="Min value"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${config.id}-max`} className="text-xs">
                      Max Value
                    </Label>
                    <Input
                      id={`${config.id}-max`}
                      type="number"
                      value={config.max?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number.parseFloat(e.target.value) : undefined
                        onChange(propertyKey, { ...config, max: val })
                      }}
                      className="h-8 text-sm"
                      placeholder="Max value"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`${config.id}-integer`}
                    checked={config.integer || false}
                    onCheckedChange={checked =>
                      onChange(propertyKey, { ...config, integer: checked })}
                  />
                  <Label htmlFor={`${config.id}-integer`} className="text-xs">
                    Integer Only
                  </Label>
                </div>
              </div>
            )}

            {isObjectPortConfig(config) && (
              <div className="border p-3 rounded-md bg-muted/20">
                <p className="text-sm text-muted-foreground">Object Schema Editor - Coming soon</p>
              </div>
            )}

            {isArrayPortConfig(config) && (
              <div className="border p-3 rounded-md bg-muted/20">
                <p className="text-sm text-muted-foreground">Array Item Editor - Coming soon</p>
              </div>
            )}
          </CardContent>
        </div>
      )}
    </Card>
  )
}

/**
 * Get an icon component for a port type
 */
function getTypeIcon(type: PortType) {
  switch (type) {
    case 'string':
      return <Type className="h-4 w-4" />
    case 'number':
      return <Hash className="h-4 w-4" />
    case 'boolean':
      return <ToggleLeft className="h-4 w-4" />
    case 'object':
      return <Layers className="h-4 w-4" />
    case 'array':
      return <List className="h-4 w-4" />
    case 'enum':
      return <AlignLeft className="h-4 w-4" />
    default:
      return <Settings className="h-4 w-4" />
  }
}

/**
 * Get a color for a port type
 */
function getTypeColor(type: PortType): string {
  switch (type) {
    case 'string':
      return '#3b82f6' // blue-500
    case 'number':
      return '#ef4444' // red-500
    case 'boolean':
      return '#10b981' // emerald-500
    case 'object':
      return '#8b5cf6' // violet-500
    case 'array':
      return '#f59e0b' // amber-500
    case 'enum':
      return '#6366f1' // indigo-500
    default:
      return '#6b7280' // gray-500
  }
}

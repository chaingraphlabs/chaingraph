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
  IObjectSchema,
  IPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  PortType,
  StringPortConfig,
} from '@badaitech/chaingraph-types'
import type { SchemaEditorProps } from './types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { PORT_TYPES } from '@badaitech/chaingraph-types'
import { Bug, FileCode, Layers, Plus, Save, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PropertyItem } from './PropertyItem'
import { SchemaEditorProvider, useSchemaEditor } from './SchemaEditorContext'
import { isArrayPortConfig, isObjectPortConfig } from './types'

/**
 * The main Schema Editor component.
 * Provides a UI for editing port schemas with support for nested properties.
 */
export function SchemaEditor({
  initialConfig,
  onSave,
  title = 'Schema Editor',
  defaultType = 'object',
  allowClose = true,
  onCancel,
}: SchemaEditorProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [tab, setTab] = useState('visual')
  const [isAddPropertyDialogOpen, setIsAddPropertyDialogOpen] = useState(false)
  const [newPropertyName, setNewPropertyName] = useState('')
  const [newPropertyType, setNewPropertyType] = useState<PortType>('string')

  // Close handler - confirm if there are unsaved changes
  const handleClose = useCallback(() => {
    if (onCancel) {
      onCancel()
    }
    setIsOpen(false)
  }, [onCancel])

  return (
    <SchemaEditorProvider initialConfig={initialConfig || undefined}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-[800px] p-0 flex flex-col h-[90vh]"
        >
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                  Create and edit schema properties
                </DialogDescription>
              </div>

              {allowClose && (
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <Tabs defaultValue="visual" value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
            <div className="border-b px-6 py-2">
              <TabsList>
                <TabsTrigger value="visual" className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  <span>Visual Editor</span>
                </TabsTrigger>
                <TabsTrigger value="json" className="flex items-center gap-1">
                  <FileCode className="h-4 w-4" />
                  <span>JSON</span>
                </TabsTrigger>
                <TabsTrigger value="debug" className="flex items-center gap-1">
                  <Bug className="h-4 w-4" />
                  <span>Debug</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="visual" className="flex-1 flex flex-col">
              <SchemaEditorContent
                onSave={onSave}
                openAddPropertyDialog={() => setIsAddPropertyDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="json" className="flex-1 p-6">
              <SchemaEditorJson onSave={onSave} />
            </TabsContent>

            <TabsContent value="debug" className="flex-1 p-6">
              <SchemaEditorDebug />
            </TabsContent>
          </Tabs>

          <AddPropertyDialog
            open={isAddPropertyDialogOpen}
            onOpenChange={setIsAddPropertyDialogOpen}
            propertyName={newPropertyName}
            onPropertyNameChange={setNewPropertyName}
            propertyType={newPropertyType}
            onPropertyTypeChange={type => setNewPropertyType(type)}
          />
        </DialogContent>
      </Dialog>
    </SchemaEditorProvider>
  )
}

/**
 * Content component for the visual schema editor
 */
interface SchemaEditorContentProps {
  onSave: (config: IPortConfig) => void
  openAddPropertyDialog: () => void
}

function SchemaEditorContent({ onSave, openAddPropertyDialog }: SchemaEditorContentProps) {
  const { node, getSchemaPortId, getPortById, updatePort } = useSchemaEditor()

  // Get the main schema port
  const schemaPortId = getSchemaPortId()
  const mainPort = getPortById(schemaPortId)

  // Get properties based on the port type
  const properties = useMemo(() => {
    if (!mainPort)
      return {}

    if (isObjectPortConfig(mainPort)) {
      return mainPort.schema?.properties || {}
    }

    if (isArrayPortConfig(mainPort)) {
      return { item: mainPort.itemConfig }
    }

    // For simple types, just show the main port itself
    return {}
  }, [mainPort])

  // Handle property changes
  const handlePropertyChange = useCallback((key: string, config: IPortConfig) => {
    if (!mainPort || !config)
      return

    if (isObjectPortConfig(mainPort)) {
      // Update the object schema
      const updatedSchema: IObjectSchema = {
        ...(mainPort.schema || { properties: {} }),
        properties: {
          ...(mainPort.schema?.properties || {}),
          [key]: config,
        },
      }

      // Update the port config with the new schema
      updatePort({
        ...mainPort,
        schema: updatedSchema,
      } as ObjectPortConfig)
    } else if (isArrayPortConfig(mainPort)) {
      // Update the array item config
      updatePort({
        ...mainPort,
        itemConfig: config,
      } as ArrayPortConfig)
    }
    // For simple types, no special handling needed
  }, [mainPort, updatePort])

  // Handle property removal
  const handlePropertyRemove = useCallback((key: string) => {
    if (!mainPort || !isObjectPortConfig(mainPort))
      return

    // Create a new schema without the removed property
    const updatedProperties = { ...(mainPort.schema?.properties || {}) }
    delete updatedProperties[key]

    const updatedSchema: IObjectSchema = {
      ...(mainPort.schema || { properties: {} }),
      properties: updatedProperties,
    }

    // Update the port config with the new schema
    updatePort({
      ...mainPort,
      schema: updatedSchema,
    } as ObjectPortConfig)
  }, [mainPort, updatePort])

  // Handle saving the schema
  const handleSave = useCallback(() => {
    if (mainPort && 'type' in mainPort) {
      // Only save if we have a valid port configuration
      onSave(mainPort as IPortConfig)
    }
  }, [mainPort, onSave])

  if (!mainPort) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No schema configuration available</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isObjectPortConfig(mainPort) && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Properties</h3>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={openAddPropertyDialog}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Property</span>
                </Button>
              </div>

              <div className="space-y-3">
                {Object.entries(properties).map(([key, config]) => (
                  <PropertyItem
                    key={key}
                    propertyKey={key}
                    config={config as IPortConfig}
                    onChange={handlePropertyChange}
                    onRemove={handlePropertyRemove}
                  />
                ))}

                {Object.keys(properties).length === 0 && (
                  <div className="border border-dashed rounded-md p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">No properties defined</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openAddPropertyDialog}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Property</span>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {isArrayPortConfig(mainPort) && (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium">Array Item Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Configure the structure of each item in the array
                </p>
              </div>

              <PropertyItem
                propertyKey="item"
                config={mainPort.itemConfig}
                onChange={(_, config) => {
                  if (config) {
                    handlePropertyChange('item', config as IPortConfig)
                  }
                }}
                onRemove={() => { }}
                canRemove={false}
                canEditKey={false}
              />
            </>
          )}

          {!isObjectPortConfig(mainPort) && !isArrayPortConfig(mainPort) && (
            <div className="border rounded-md p-6">
              <h3 className="text-lg font-medium mb-2">Simple Type Configuration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure this
                {' '}
                {mainPort.type}
                {' '}
                port
              </p>

              <PropertyItem
                propertyKey={mainPort.title || 'value'}
                config={mainPort as IPortConfig}
                onChange={(_, config) => {
                  if (config) {
                    updatePort(config as IPortConfig)
                  }
                }}
                onRemove={() => { }}
                canRemove={false}
                canEditKey={false}
              />
            </div>
          )}
        </div>
        <ScrollBar />
      </ScrollArea>

      <div className="border-t p-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            // Reset to initial config or close
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="gap-1"
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </Button>
      </div>
    </>
  )
}

/**
 * Dialog for adding a new property to an object schema
 */
interface AddPropertyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyName: string
  onPropertyNameChange: (name: string) => void
  propertyType: PortType
  onPropertyTypeChange: (type: PortType) => void
}

function AddPropertyDialog({
  open,
  onOpenChange,
  propertyName,
  onPropertyNameChange,
  propertyType,
  onPropertyTypeChange,
}: AddPropertyDialogProps) {
  const { getSchemaPortId, getPortById, updatePort } = useSchemaEditor()

  // Get the main schema port
  const schemaPortId = getSchemaPortId()
  const mainPort = getPortById(schemaPortId)

  // Check if the property name is valid
  const isPropertyNameValid = useMemo(() => {
    if (!propertyName.trim())
      return false

    if (!mainPort)
      return false

    // Check if the property already exists
    if (isObjectPortConfig(mainPort)) {
      return !Object.keys(mainPort.schema?.properties || {}).includes(propertyName)
    }

    return true
  }, [propertyName, mainPort])

  // Handle adding the new property
  const handleAddProperty = useCallback(() => {
    if (!isPropertyNameValid || !mainPort || !isObjectPortConfig(mainPort))
      return

    // Create a new property config based on the selected type
    let newPropertyConfig: IPortConfig

    // Create the appropriate property config based on type
    switch (propertyType) {
      case 'object':
        newPropertyConfig = {
          type: 'object',
          title: propertyName,
          schema: {
            properties: {},
            type: 'object',
            description: 'Object Schema',
          },
        } as ObjectPortConfig
        break

      case 'array':
        newPropertyConfig = {
          type: 'array',
          title: propertyName,
          itemConfig: {
            type: 'string',
            title: 'Item',
          },
          isMutable: true,
          isSchemaMutable: true,
        } as ArrayPortConfig
        break

      case 'string':
        newPropertyConfig = {
          type: 'string',
          title: propertyName,
        } as StringPortConfig
        break

      case 'number':
        newPropertyConfig = {
          type: 'number',
          title: propertyName,
        } as NumberPortConfig
        break

      case 'boolean':
        newPropertyConfig = {
          type: 'boolean',
          title: propertyName,
        } as BooleanPortConfig
        break

      case 'enum':
        newPropertyConfig = {
          type: 'enum',
          title: propertyName,
          options: [
            { type: 'string', title: 'Option 1' },
            { type: 'string', title: 'Option 2' },
          ],
        } as EnumPortConfig
        break

      default:
        // Default to string for any other type
        newPropertyConfig = {
          type: 'string',
          title: propertyName,
        } as StringPortConfig
        break
    }

    // Update the schema with the new property
    const updatedSchema: IObjectSchema = {
      ...(mainPort.schema || { properties: {} }),
      properties: {
        ...(mainPort.schema?.properties || {}),
        [propertyName]: newPropertyConfig,
      },
    }

    // Update the port config with the new schema
    updatePort({
      ...mainPort,
      schema: updatedSchema,
    } as ObjectPortConfig)

    // Reset the form
    onPropertyNameChange('')
    onPropertyTypeChange('string')
    onOpenChange(false)
  }, [isPropertyNameValid, mainPort, propertyName, propertyType, onPropertyNameChange, onPropertyTypeChange, onOpenChange, updatePort])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Add a new property to the schema
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="property-name">Property Name</Label>
            <Input
              id="property-name"
              value={propertyName}
              onChange={e => onPropertyNameChange(e.target.value)}
              placeholder="Enter property name"
              autoFocus
            />
            {!isPropertyNameValid && propertyName.trim() && (
              <p className="text-xs text-destructive">
                This property name already exists or is invalid
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="property-type">Property Type</Label>
            <Select value={propertyType} onValueChange={onPropertyTypeChange}>
              <SelectTrigger id="property-type">
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                {PORT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddProperty}
            disabled={!isPropertyNameValid || !propertyName.trim()}
          >
            Add Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * JSON view for the schema editor
 */
function SchemaEditorJson({ onSave }: { onSave: (config: IPortConfig) => void }) {
  const { getSchemaPortId, getPortById, updatePort } = useSchemaEditor()
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Get the main schema port
  const schemaPortId = getSchemaPortId()
  const mainPort = getPortById(schemaPortId)

  // Update JSON text when the schema changes
  useEffect(() => {
    if (!mainPort)
      return

    try {
      setJsonText(JSON.stringify(mainPort, null, 2))
      setError(null)
    } catch (err) {
      setError('Error serializing schema')
    }
  }, [mainPort])

  // Handle saving the JSON
  const handleSaveJson = useCallback(() => {
    try {
      const parsedConfig = JSON.parse(jsonText) as IPortConfig
      updatePort(parsedConfig)
      onSave(parsedConfig)
      setError(null)
    } catch (err) {
      setError('Invalid JSON format')
    }
  }, [jsonText, updatePort, onSave])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative">
        <textarea
          className={cn(
            'w-full h-full p-4 font-mono text-sm bg-muted rounded-md resize-none focus:outline-none',
            error && 'border-destructive',
          )}
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          spellCheck={false}
        />
      </div>

      {error && (
        <div className="mt-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (mainPort) {
              setJsonText(JSON.stringify(mainPort, null, 2))
              setError(null)
            }
          }}
        >
          Reset
        </Button>
        <Button
          onClick={handleSaveJson}
          disabled={!jsonText.trim() || !!error}
        >
          Apply JSON
        </Button>
      </div>
    </div>
  )
}

/**
 * Debug view for the schema editor
 */
function SchemaEditorDebug() {
  const { node, getSchemaPortId } = useSchemaEditor()

  // Get the main schema port
  const schemaPortId = getSchemaPortId()
  const port = node.getPort(schemaPortId)

  // Debug information
  const debugInfo = useMemo(() => {
    return {
      node: {
        id: node.id,
        metadata: node.metadata,
        ports: Array.from(node.ports.keys()),
      },
      port: port
        ? {
            id: port.id,
            type: port.getConfig().type,
            config: port.getConfig(),
          }
        : null,
    }
  }, [node, port])

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medium mb-2">Debug Information</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Internal state of the schema editor
      </p>

      <pre className="bg-muted p-4 rounded-md text-xs overflow-auto flex-1">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}

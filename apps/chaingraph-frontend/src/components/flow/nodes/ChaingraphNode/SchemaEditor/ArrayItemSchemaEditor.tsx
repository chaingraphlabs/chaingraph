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
} from '@badaitech/chaingraph-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  PORT_TYPES,
} from '@badaitech/chaingraph-types'
import { AlignLeft, FileCode, Hash, Layers, Save, ToggleLeft, Type, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { PropertyItem } from './PropertyItem'
import { SchemaEditorProvider, useSchemaEditor } from './SchemaEditorContext'

/**
 * Props for the ArrayItemSchemaEditor component
 */
interface ArrayItemSchemaEditorProps {
  /** The array port configuration that contains itemConfig */
  arrayPortConfig: ArrayPortConfig
  /** Called when the item config is updated */
  onSave: (updatedItemConfig: IPortConfig) => void
  /** Title to display in the editor */
  title?: string
  /** Whether the editor is open */
  open: boolean
  /** Called when the editor is opened or closed */
  onOpenChange: (open: boolean) => void
}

/**
 * A specialized schema editor for array item configurations.
 * This component allows editing the itemConfig property of an ArrayPortConfig.
 */
export function ArrayItemSchemaEditor({
  arrayPortConfig,
  onSave,
  title = 'Edit Array Item Schema',
  open,
  onOpenChange,
}: ArrayItemSchemaEditorProps) {
  const [tab, setTab] = useState('visual')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] p-0 flex flex-col h-[90vh]">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Configure the structure of items in this array
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <SchemaEditorProvider initialConfig={arrayPortConfig.itemConfig}>
          <Tabs
            defaultValue="visual"
            value={tab}
            onValueChange={setTab}
            className="flex-1 flex flex-col"
          >
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
              </TabsList>
            </div>

            <TabsContent value="visual" className="flex-1 flex flex-col">
              <ArrayItemEditorContent onSave={onSave} />
            </TabsContent>

            <TabsContent value="json" className="flex-1 p-6">
              <JsonEditor onSave={onSave} />
            </TabsContent>
          </Tabs>
        </SchemaEditorProvider>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Visual editor content for editing an array item configuration
 */
function ArrayItemEditorContent({ onSave }: { onSave: (config: IPortConfig) => void }) {
  const { getSchemaPortId, getPortById, updatePort, node } = useSchemaEditor()

  // Get the main schema port (the item config)
  const schemaPortId = getSchemaPortId()
  const itemConfig = getPortById(schemaPortId) || { type: 'string', title: 'Item' } as IPortConfig
  const [selectedType, setSelectedType] = useState<string>(itemConfig?.type || 'string')

  // Handle type change
  const handleTypeChange = useCallback((newType: string) => {
    if (!itemConfig)
      return

    // Save basic properties that should be preserved
    const title = itemConfig.title || 'Item'
    const description = itemConfig.description || ''

    // Create a new config based on the selected type
    let newConfig: IPortConfig

    switch (newType) {
      case 'string':
        newConfig = {
          type: 'string',
          title,
          description,
        } as StringPortConfig
        break

      case 'number':
        newConfig = {
          type: 'number',
          title,
          description,
        } as NumberPortConfig
        break

      case 'boolean':
        newConfig = {
          type: 'boolean',
          title,
          description,
        } as BooleanPortConfig
        break

      case 'object':
        newConfig = {
          type: 'object',
          title,
          description,
          schema: {
            properties: {},
            type: 'object',
            description: 'Object Schema',
          },
          isSchemaMutable: true,
        } as ObjectPortConfig
        break

      case 'array':
        newConfig = {
          type: 'array',
          title,
          description,
          itemConfig: {
            type: 'string',
            title: 'Item',
          },
          isMutable: true,
        } as ArrayPortConfig
        break

      case 'enum':
        newConfig = {
          type: 'enum',
          title,
          description,
          options: [
            { type: 'string', title: 'Option 1' },
            { type: 'string', title: 'Option 2' },
          ],
        } as EnumPortConfig
        break

      default:
        newConfig = {
          type: 'string',
          title,
          description,
        } as StringPortConfig
    }

    // Update the port with the new config
    setSelectedType(newType)
    updatePort(newConfig)
  }, [itemConfig, updatePort])

  // Handle saving the updated item config
  const handleSave = useCallback(() => {
    if (itemConfig && 'type' in itemConfig) {
      onSave(itemConfig as IPortConfig)
    }
  }, [itemConfig, onSave])

  if (!itemConfig) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No item configuration available</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">
              Array Item Type:
              <span className="text-primary">{itemConfig.type}</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure the schema for each item in the array
            </p>

            <div className="flex items-center gap-2 mb-5">
              <label className="text-sm font-medium">Item Type:</label>
              <Select
                value={selectedType}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select item type" />
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
            </div>

            <PropertyItem
              propertyKey={itemConfig.title || 'Item Config'}
              config={itemConfig as IPortConfig}
              onChange={(_, config) => {
                if (config) {
                  updatePort(config as IPortConfig)
                }
              }}
              onRemove={() => { }} // Can't remove the main config
              canRemove={false}
              canEditKey={false}
            />

            {/* Type-specific editors */}
            <div className="mt-6 border-t pt-4">
              <h4 className="text-base font-medium mb-3">Type-Specific Configuration</h4>

              {/* String type configuration */}
              {selectedType === 'string' && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">String Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Min Length</Label>
                        <Input
                          type="number"
                          placeholder="Minimum length"
                          value={(itemConfig as StringPortConfig).minLength?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number.parseInt(e.target.value) : undefined
                            updatePort({
                              ...itemConfig,
                              minLength: val,
                            } as StringPortConfig)
                          }}
                        />
                      </div>
                      <div>
                        <Label>Max Length</Label>
                        <Input
                          type="number"
                          placeholder="Maximum length"
                          value={(itemConfig as StringPortConfig).maxLength?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number.parseInt(e.target.value) : undefined
                            updatePort({
                              ...itemConfig,
                              maxLength: val,
                            } as StringPortConfig)
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isTextArea"
                        checked={(itemConfig as StringPortConfig).ui?.isTextArea || false}
                        onCheckedChange={(checked) => {
                          updatePort({
                            ...itemConfig,
                            ui: {
                              ...(itemConfig.ui || {}),
                              isTextArea: checked,
                            },
                          } as StringPortConfig)
                        }}
                      />
                      <Label htmlFor="isTextArea">Multiline Text</Label>
                    </div>

                    <div>
                      <Label>Pattern (Regex)</Label>
                      <Input
                        placeholder="Regular expression pattern"
                        value={(itemConfig as StringPortConfig).pattern || ''}
                        onChange={(e) => {
                          updatePort({
                            ...itemConfig,
                            pattern: e.target.value || undefined,
                          } as StringPortConfig)
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Number type configuration */}
              {selectedType === 'number' && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Number Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Min Value</Label>
                        <Input
                          type="number"
                          placeholder="Minimum value"
                          value={(itemConfig as NumberPortConfig).min?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number.parseFloat(e.target.value) : undefined
                            updatePort({
                              ...itemConfig,
                              min: val,
                            } as NumberPortConfig)
                          }}
                        />
                      </div>
                      <div>
                        <Label>Max Value</Label>
                        <Input
                          type="number"
                          placeholder="Maximum value"
                          value={(itemConfig as NumberPortConfig).max?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number.parseFloat(e.target.value) : undefined
                            updatePort({
                              ...itemConfig,
                              max: val,
                            } as NumberPortConfig)
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Step</Label>
                        <Input
                          type="number"
                          placeholder="Step increment"
                          value={(itemConfig as NumberPortConfig).step?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number.parseFloat(e.target.value) : undefined
                            updatePort({
                              ...itemConfig,
                              step: val,
                            } as NumberPortConfig)
                          }}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="integer"
                          checked={(itemConfig as NumberPortConfig).integer || false}
                          onCheckedChange={(checked) => {
                            updatePort({
                              ...itemConfig,
                              integer: checked,
                            } as NumberPortConfig)
                          }}
                        />
                        <Label htmlFor="integer">Integer Only</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Boolean type configuration */}
              {selectedType === 'boolean' && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Boolean Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="defaultValue"
                        checked={(itemConfig as BooleanPortConfig).defaultValue || false}
                        onCheckedChange={(checked) => {
                          updatePort({
                            ...itemConfig,
                            defaultValue: checked,
                          } as BooleanPortConfig)
                        }}
                      />
                      <Label htmlFor="defaultValue">Default Value</Label>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Array type configuration */}
              {selectedType === 'array' && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Array Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isMutable"
                        checked={(itemConfig as ArrayPortConfig).isMutable || false}
                        onCheckedChange={(checked) => {
                          updatePort({
                            ...itemConfig,
                            isMutable: checked,
                          } as ArrayPortConfig)
                        }}
                      />
                      <Label htmlFor="isMutable">Allow Adding/Removing Items</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Min Length</Label>
                        <Input
                          type="number"
                          placeholder="Minimum items"
                          value={(itemConfig as ArrayPortConfig).minLength?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number.parseInt(e.target.value) : undefined
                            updatePort({
                              ...itemConfig,
                              minLength: val,
                            } as ArrayPortConfig)
                          }}
                        />
                      </div>
                      <div>
                        <Label>Max Length</Label>
                        <Input
                          type="number"
                          placeholder="Maximum items"
                          value={(itemConfig as ArrayPortConfig).maxLength?.toString() || ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number.parseInt(e.target.value) : undefined
                            updatePort({
                              ...itemConfig,
                              maxLength: val,
                            } as ArrayPortConfig)
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-sm">To configure child item types, save and open the schema editor again</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Object type configuration */}
              {selectedType === 'object' && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Object Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isSchemaMutable"
                        checked={(itemConfig as ObjectPortConfig).isSchemaMutable || false}
                        onCheckedChange={(checked) => {
                          updatePort({
                            ...itemConfig,
                            isSchemaMutable: checked,
                          } as ObjectPortConfig)
                        }}
                      />
                      <Label htmlFor="isSchemaMutable">Allow Adding/Removing Properties</Label>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-sm">To configure object properties, save and open the schema editor again</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enum type configuration */}
              {selectedType === 'enum' && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Enum Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">Define options for enum values:</p>

                    {(itemConfig as EnumPortConfig).options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option.title || ''}
                          onChange={(e) => {
                            const newOptions = [...((itemConfig as EnumPortConfig).options || [])]
                            newOptions[index] = {
                              ...newOptions[index],
                              title: e.target.value,
                            }

                            updatePort({
                              ...itemConfig,
                              options: newOptions,
                            } as EnumPortConfig)
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const newOptions = [...((itemConfig as EnumPortConfig).options || [])]
                            newOptions.splice(index, 1)

                            updatePort({
                              ...itemConfig,
                              options: newOptions,
                            } as EnumPortConfig)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => {
                        const newOptions = [...((itemConfig as EnumPortConfig).options || [])]
                        newOptions.push({
                          type: 'string',
                          title: `Option ${newOptions.length + 1}`,
                        })

                        updatePort({
                          ...itemConfig,
                          options: newOptions,
                        } as EnumPortConfig)
                      }}
                    >
                      Add Option
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t p-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            // Cancel/reset
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="gap-1"
        >
          <Save className="h-4 w-4" />
          <span>Apply Changes</span>
        </Button>
      </div>
    </>
  )
}

/**
 * JSON editor for editing the array item config as raw JSON
 */
function JsonEditor({ onSave }: { onSave: (config: IPortConfig) => void }) {
  const { getSchemaPortId, getPortById, updatePort } = useSchemaEditor()
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Get the main schema port and set up JSON editor
  const schemaPortId = getSchemaPortId()
  const itemConfig = getPortById(schemaPortId)

  // Update JSON when config changes
  useEffect(() => {
    if (itemConfig) {
      try {
        setJsonText(JSON.stringify(itemConfig, null, 2))
        setError(null)
      } catch (err) {
        setError('Error serializing item configuration')
      }
    }
  }, [itemConfig])

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
      <div className="mb-2">
        <h3 className="text-sm font-medium mb-1">JSON Editor</h3>
        <p className="text-xs text-muted-foreground">
          Edit the array item configuration directly as JSON
        </p>
      </div>

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
            if (itemConfig) {
              setJsonText(JSON.stringify(itemConfig, null, 2))
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
 * Get an icon for a port type
 */
function getTypeIcon(type: string) {
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
      return <FileCode className="h-4 w-4" />
    case 'enum':
      return <AlignLeft className="h-4 w-4" />
    default:
      return null
  }
}

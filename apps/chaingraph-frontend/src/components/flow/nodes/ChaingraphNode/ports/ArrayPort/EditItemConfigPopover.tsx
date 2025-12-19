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
  IObjectSchema,
  IPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  PortType,
  StringPortConfig,
} from '@badaitech/chaingraph-types'
import { PORT_TYPES } from '@badaitech/chaingraph-types'
import { Settings } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { ObjectSchemaEditor } from './ObjectSchemaEditor'

export interface EditItemConfigPopoverProps {
  portConfig: ArrayPortConfig
  onSave: (updatedConfig: ArrayPortConfig) => void
}

export function EditItemConfigPopover({
  portConfig,
  onSave,
}: EditItemConfigPopoverProps) {
  const [open, setOpen] = useState(false)
  const [editedConfig, setEditedConfig] = useState<IPortConfig>(
    () => ({ ...portConfig.itemConfig }),
  )

  const handleTypeChange = useCallback((newType: PortType) => {
    // Create a new config with the base properties
    const title = editedConfig.title || 'Item'
    const description = editedConfig.description || ''

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
            type: 'object' as const,
            description: 'Object Schema',
          },
          isSchemaMutable: true,
        }
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
          isSchemaMutable: true,
        }
        break

      default:
        // Default to string for simplicity
        newConfig = {
          type: 'string',
          title,
          description,
        }
    }

    setEditedConfig(newConfig)
  }, [editedConfig])

  const handleSave = useCallback(() => {
    // Update the array port's itemConfig
    const updatedConfig: ArrayPortConfig = {
      ...portConfig,
      itemConfig: editedConfig,
    }

    onSave(updatedConfig)
    setOpen(false)
  }, [portConfig, editedConfig, onSave])

  // Helper function to update a property in the config
  const updateProperty = useCallback((property: string, value: any) => {
    setEditedConfig(prev => ({
      ...prev,
      [property]: value,
    }))
  }, [])

  // Helper function to update a UI property
  const updateUIProperty = useCallback((property: string, value: any) => {
    setEditedConfig(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        [property]: value,
      },
    }))
  }, [])

  // Handler for object schema changes
  const handleObjectSchemaChange = useCallback((schema: IObjectSchema) => {
    setEditedConfig((prev) => {
      if (prev.type !== 'object')
        return prev

      return {
        ...prev,
        schema,
      } as ObjectPortConfig
    })
  }, [])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 rounded-sm"
        onClick={() => setOpen(true)}
        title="Edit Item Type Configuration"
      >
        <Settings className="h-3 w-3" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Array Item Configuration</DialogTitle>
            <DialogDescription>
              Configure how items in this array should be structured
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="itemType">Item Type</Label>
            <Select
              value={editedConfig.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger id="itemType">
                <SelectValue placeholder="Select item type" />
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

          <Tabs defaultValue="basic" className="mt-3">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger
                value="schema"
                disabled={editedConfig.type !== 'object'}
              >
                Schema
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="itemTitle">Title</Label>
                <Input
                  id="itemTitle"
                  value={editedConfig.title || ''}
                  onChange={e => updateProperty('title', e.target.value)}
                  placeholder="Item title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemDescription">Description</Label>
                <Input
                  id="itemDescription"
                  value={editedConfig.description || ''}
                  onChange={e => updateProperty('description', e.target.value)}
                  placeholder="Item description"
                />
              </div>

              {/* Type-specific options */}
              {editedConfig.type === 'string' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">String Options</h4>

                  <div className="space-y-2">
                    <Label htmlFor="minLength">Min Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      value={editedConfig.minLength?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number.parseInt(e.target.value) : undefined
                        updateProperty('minLength', val)
                      }}
                      placeholder="Minimum length"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxLength">Max Length</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      value={editedConfig.maxLength?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number.parseInt(e.target.value) : undefined
                        updateProperty('maxLength', val)
                      }}
                      placeholder="Maximum length"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isTextArea"
                      checked={editedConfig.ui?.isTextArea || false}
                      onCheckedChange={checked => updateUIProperty('isTextArea', checked)}
                    />
                    <Label htmlFor="isTextArea">Use Textarea</Label>
                  </div>
                </div>
              )}

              {editedConfig.type === 'number' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">Number Options</h4>

                  <div className="space-y-2">
                    <Label htmlFor="min">Min Value</Label>
                    <Input
                      id="min"
                      type="number"
                      value={editedConfig.min?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number.parseFloat(e.target.value) : undefined
                        updateProperty('min', val)
                      }}
                      placeholder="Minimum value"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max">Max Value</Label>
                    <Input
                      id="max"
                      type="number"
                      value={editedConfig.max?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number.parseFloat(e.target.value) : undefined
                        updateProperty('max', val)
                      }}
                      placeholder="Maximum value"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="integer"
                      checked={editedConfig.integer || false}
                      onCheckedChange={checked => updateProperty('integer', checked)}
                    />
                    <Label htmlFor="integer">Integer Only</Label>
                  </div>
                </div>
              )}

              {editedConfig.type === 'array' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">Array Options</h4>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isMutable"
                      checked={(editedConfig as ArrayPortConfig)?.isMutable || false}
                      onCheckedChange={checked =>
                        updateProperty('isMutable', checked)}
                    />
                    <Label htmlFor="isMutable">Allow Adding/Removing Elements</Label>
                  </div>
                </div>
              )}

              {editedConfig.type === 'object' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">Object Options</h4>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isSchemaMutable"
                      checked={(editedConfig as ObjectPortConfig)?.isSchemaMutable || false}
                      onCheckedChange={checked =>
                        updateProperty('isSchemaMutable', checked)}
                    />
                    <Label htmlFor="isSchemaMutable">Allow Adding/Removing Properties</Label>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="schema">
              {editedConfig.type === 'object' && (
                <div className="py-4">
                  <h4 className="text-sm font-medium mb-2">Object Schema</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Define the structure of object items for this array
                  </p>

                  <div className="border rounded-md bg-muted/10">
                    {/* <ObjectSchemaEditor
                      initialSchema={(editedConfig as ObjectPortConfig).schema}
                      onChange={handleObjectSchemaChange}
                    /> */}
                    <div className="p-4 text-sm text-muted-foreground">
                      ObjectSchemaEditor component goes here.
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

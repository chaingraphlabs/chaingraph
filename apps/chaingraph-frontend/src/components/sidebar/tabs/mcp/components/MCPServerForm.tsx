/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CreateMCPServerEvent, UpdateMCPServerEvent } from '../store'
import type { MCPServerWithCapabilities } from '../store/types'
import { Cross1Icon, PlusIcon, TrashIcon } from '@radix-ui/react-icons'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, Input, Label, Switch } from '@/components/ui'
import { getTemplateVariables } from '../utils'

interface MCPServerFormProps {
  server?: MCPServerWithCapabilities
  onCancel: () => void
  onCreate?: (data: CreateMCPServerEvent) => void
  onUpdate?: (data: UpdateMCPServerEvent) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
  isUpdating?: boolean
  isDeleting?: boolean
  error?: Error | null
}

// Component for template variable badge
const TemplateVariableBadge = ({ variables }: { variables: string[] }) => {
  if (variables.length === 0)
    return null

  return (
    <div className="flex gap-1 flex-wrap mt-1">
      {variables.map(varName => (
        <Badge key={varName} variant="secondary" className="text-xs">
          {varName}
        </Badge>
      ))}
    </div>
  )
}

export function MCPServerForm({
  server,
  onCancel,
  onCreate,
  onUpdate,
  onDelete,
  isLoading = false,
  isUpdating = false,
  isDeleting = false,
  error,
}: MCPServerFormProps) {
  const isEditMode = Boolean(server)
  const [title, setTitle] = useState(server?.title || '')
  const [url, setUrl] = useState(server?.url || '')
  const [authHeaders, setAuthHeaders] = useState<Array<{
    key: string
    value: string
    isTemplate?: boolean
    templateRequired?: boolean
  }>>(server?.authHeaders || [])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleAddHeader = () => {
    setAuthHeaders([...authHeaders, { key: '', value: '', isTemplate: false, templateRequired: true }])
  }

  const handleRemoveHeader = (index: number) => {
    setAuthHeaders(authHeaders.filter((_, i) => i !== index))
  }

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...authHeaders]
    newHeaders[index][field] = value
    setAuthHeaders(newHeaders)
  }

  const handleTemplateToggle = (index: number, enabled: boolean) => {
    const newHeaders = [...authHeaders]
    newHeaders[index].isTemplate = enabled
    if (enabled && newHeaders[index].templateRequired === undefined) {
      newHeaders[index].templateRequired = true // default to required
    }
    setAuthHeaders(newHeaders)
  }

  const handleRequiredToggle = (index: number, required: boolean) => {
    const newHeaders = [...authHeaders]
    newHeaders[index].templateRequired = required
    setAuthHeaders(newHeaders)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const filteredHeaders = authHeaders.filter(h => h.key && h.value)

    if (isEditMode && onUpdate && server?.id) {
      onUpdate({ id: server.id, title, url, authHeaders: filteredHeaders })
    } else if (!isEditMode && onCreate) {
      onCreate({ title, url, authHeaders: filteredHeaders })
    }
  }

  const handleDelete = () => {
    if (onDelete && server?.id) {
      onDelete(server.id)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    onCancel()
  }

  return (
    <Card className="shadow-lg border-primary bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            delay: 0.1,
            duration: 0.2,
          },
        }}
        exit={{ opacity: 0, y: 10 }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {isEditMode ? 'Edit MCP Server' : 'Add MCP Server'}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              disabled={isLoading || isUpdating || isDeleting}
            >
              <Cross1Icon className="h-4 w-4" />
            </Button>
          </div>

          {server?.id && (
            <div className="text-sm text-muted-foreground">
              Server ID:
              {' '}
              {server.id}
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-2">
            <Label>Server Name</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter a name for this server..."
              required
              disabled={isLoading || isUpdating || isDeleting}
            />
          </div>

          {/* URL Field */}
          <div className="space-y-2">
            <Label>Server URL</Label>
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Enter MCP server URL..."
              required
              disabled={isLoading || isUpdating || isDeleting}
            />
          </div>

          {/* Auth Headers Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Authentication Headers</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddHeader}
                disabled={isLoading || isUpdating || isDeleting}
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Add Header
              </Button>
            </div>

            {authHeaders.length > 0 && (
              <div className="space-y-3">
                {authHeaders.map((header, index) => {
                  const templateVars = getTemplateVariables(header.value)
                  const isTemplate = header.isTemplate || false
                  const isRequired = header.templateRequired !== false // default true

                  return (
                    <div key={`header-${index}`} className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={header.key}
                          onChange={e => handleHeaderChange(index, 'key', e.target.value)}
                          placeholder="Header name"
                          className="flex-1"
                          disabled={isLoading || isUpdating || isDeleting}
                        />
                        <Input
                          value={header.value}
                          onChange={e => handleHeaderChange(index, 'value', e.target.value)}
                          placeholder={isTemplate ? 'e.g., Bearer {{api_token}}' : 'Header value'}
                          className="flex-1"
                          type={isTemplate ? 'text' : 'password'}
                          disabled={isLoading || isUpdating || isDeleting}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveHeader(index)}
                          disabled={isLoading || isUpdating || isDeleting}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Template mode controls */}
                      <div className="flex items-center gap-3 pl-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`template-${index}`}
                            checked={isTemplate}
                            onCheckedChange={checked => handleTemplateToggle(index, checked)}
                            disabled={isLoading || isUpdating || isDeleting}
                          />
                          <Label
                            htmlFor={`template-${index}`}
                            className="text-xs text-muted-foreground cursor-pointer"
                          >
                            Template mode
                          </Label>
                        </div>

                        {/* Required toggle (only visible when template mode is on) */}
                        {isTemplate && (
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`required-${index}`}
                              checked={isRequired}
                              onCheckedChange={checked => handleRequiredToggle(index, checked)}
                              disabled={isLoading || isUpdating || isDeleting}
                            />
                            <Label
                              htmlFor={`required-${index}`}
                              className="text-xs text-muted-foreground cursor-pointer"
                            >
                              Required
                            </Label>
                          </div>
                        )}
                      </div>

                      {/* Template variable badges */}
                      {isTemplate && templateVars.length > 0 && (
                        <div className="pl-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Variables:
                          </span>
                          <TemplateVariableBadge variables={templateVars} />
                        </div>
                      )}

                      {/* Template mode help (only shown when template mode is on) */}
                      {isTemplate && templateVars.length === 0 && (
                        <div className="pl-2 text-xs text-muted-foreground">
                          Use
                          {' '}
                          <code className="bg-background px-1 py-0.5 rounded">{'{{variable_name}}'}</code>
                          {' '}
                          syntax in the value
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {authHeaders.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No authentication headers configured
              </div>
            )}

            {/* Template syntax help */}
            <div className="text-sm text-muted-foreground bg-muted/50 rounded p-3 space-y-2">
              <div className="font-medium">💡 Template Variables</div>
              <div className="space-y-1 text-xs">
                <div>
                  • Enable
                  {' '}
                  <strong>Template mode</strong>
                  {' '}
                  to use runtime variables
                </div>
                <div>
                  • Use
                  {' '}
                  <code className="bg-background px-1 py-0.5 rounded">{'{{variable_name}}'}</code>
                  {' '}
                  syntax in header values
                </div>
                <div>
                  • Example:
                  {' '}
                  <code className="bg-background px-1 py-0.5 rounded">Bearer {'{{api_token}}'}</code>
                </div>
                <div>• Variables become input ports on MCP nodes in flows</div>
                <div>
                  • Mark as
                  {' '}
                  <strong>Required</strong>
                  {' '}
                  to enforce values at execution time
                </div>
              </div>
            </div>
          </div>

          {/* Delete Section (Edit Mode Only) */}
          {isEditMode && onDelete && (
            <div className="pt-4 border-t">
              {!showDeleteConfirm
                ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:text-destructive underline"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isLoading || isUpdating || isDeleting}
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Server
                    </Button>
                  )
                : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span>This action cannot be undone.</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                        </Button>
                      </div>
                    </div>
                  )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isUpdating || isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title || !url || isLoading || isUpdating || isDeleting}
              className="flex-1"
            >
              {isEditMode
                ? (isUpdating ? 'Saving...' : 'Save Changes')
                : (isLoading ? 'Adding...' : 'Add Server')}
            </Button>
          </div>
          {error && (
            <div className="text-sm text-destructive">
              {error.message}
            </div>
          )}
        </form>
      </motion.div>
    </Card>
  )
}

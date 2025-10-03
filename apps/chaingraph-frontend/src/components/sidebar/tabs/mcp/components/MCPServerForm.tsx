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
import { Button, Card, Input, Label } from '@/components/ui'

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
  const [authHeaders, setAuthHeaders] = useState<Array<{ key: string, value: string }>>(server?.authHeaders || [])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleAddHeader = () => {
    setAuthHeaders([...authHeaders, { key: '', value: '' }])
  }

  const handleRemoveHeader = (index: number) => {
    setAuthHeaders(authHeaders.filter((_, i) => i !== index))
  }

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...authHeaders]
    newHeaders[index][field] = value
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
              <div className="space-y-2">
                {authHeaders.map((header, index) => (
                  <div key={`header-${header.key}`} className="flex gap-2">
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
                      placeholder="Header value"
                      className="flex-1"
                      type="password"
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
                ))}
              </div>
            )}

            {authHeaders.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No authentication headers configured
              </div>
            )}
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

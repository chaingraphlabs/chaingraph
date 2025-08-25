/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CreateMCPServerEvent, UpdateMCPServerEvent } from './store'
import type { MCPServerWithCapabilities } from './store/types'
import { Button, ScrollArea } from '@/components/ui'
import { useUnit } from 'effector-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { MCPServerForm } from './components/MCPServerForm'
import { MCPServerList } from './components/MCPServerList'
import {
  $createMCPServerError,
  $deleteMCPServerError,
  $isCreatingMCPServer,
  $isDeletingMCPServer,
  $isUpdatingMCPServer,
  $updateMCPServerError,
  createMCPServer,
  deleteMCPServer,
  loadMCPServers,
  updateMCPServer,
} from './store'

export function MCPTab() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingServer, setEditingServer] = useState<MCPServerWithCapabilities | undefined>(undefined)

  const {
    isCreatingServer,
    isUpdatingServer,
    isDeletingServer,
    createError,
    updateError,
    deleteError,
  } = useUnit({
    isCreatingServer: $isCreatingMCPServer,
    isUpdatingServer: $isUpdatingMCPServer,
    isDeletingServer: $isDeletingMCPServer,
    createError: $createMCPServerError,
    updateError: $updateMCPServerError,
    deleteError: $deleteMCPServerError,
  })

  // Load MCP servers on mount
  useEffect(() => {
    loadMCPServers()
  }, [])

  const handleCreateClick = useCallback(() => {
    setIsCreating(true)
    setEditingServer(undefined)
  }, [])

  const handleEditClick = useCallback((server: MCPServerWithCapabilities) => {
    setEditingServer(server)
    setIsCreating(false)
  }, [])

  const handleCreateServer = useCallback(async (event: CreateMCPServerEvent) => {
    createMCPServer(event)
    setIsCreating(false)
  }, [])

  const handleUpdateServer = useCallback(async (event: UpdateMCPServerEvent) => {
    updateMCPServer(event)
    setEditingServer(undefined)
  }, [])

  const handleDeleteServer = useCallback(async (id: string) => {
    deleteMCPServer(id)
    setEditingServer(undefined)
  }, [])

  const handleCancel = useCallback(() => {
    setIsCreating(false)
    setEditingServer(undefined)
  }, [])

  return (

    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">MCP Integration</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCreateClick}
            disabled={isCreating || Boolean(editingServer)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Server List */}
      <div className="flex-1 relative overflow-hidden">
        {!isCreating && !editingServer
          ? (
              <MCPServerList onEditServer={handleEditClick} />
            )
          : (
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <AnimatePresence mode="sync">
                    <motion.div
                      key={editingServer ? `edit-${editingServer.id}` : 'create-form'}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        y: 20,
                        scale: 0.95,
                        transition: {
                          duration: 0.2,
                        },
                      }}
                    >
                      <MCPServerForm
                        server={editingServer}
                        onCancel={handleCancel}
                        onCreate={handleCreateServer}
                        onUpdate={handleUpdateServer}
                        onDelete={handleDeleteServer}
                        isLoading={isCreatingServer}
                        isUpdating={isUpdatingServer}
                        isDeleting={isDeletingServer}
                        error={createError || updateError || deleteError}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
      </div>
    </div>
  )
}

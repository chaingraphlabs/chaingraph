/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CreateFlowEvent, FlowMetadataEvent, UpdateFlowEvent } from '@/store/flow'
import type { FlowMetadata } from '@badaitech/chaingraph-types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Cross1Icon, FrameIcon, PlusIcon, TextIcon } from '@radix-ui/react-icons'
import { Spinner } from '@radix-ui/themes' // оставляем пока
import { AnimatePresence, motion } from 'framer-motion'
import React, { useState } from 'react'
import { FlowTag } from './FlowTag'

interface FlowFormProps {
  flow?: FlowMetadata
  onCancel: () => void
  onCreate?: (data: CreateFlowEvent) => void
  onEdit?: (data: UpdateFlowEvent) => void
  isLoading?: boolean
  error?: Error | null
}

export function FlowForm({
  flow,
  onCancel,
  onCreate,
  onEdit,
  isLoading = false,
  error,
}: FlowFormProps) {
  const isEditMode = Boolean(flow)
  const [name, setName] = useState(flow?.name || '')
  const [description, setDescription] = useState(flow?.description || '')
  const [tags, setTags] = useState<string[]>(flow?.tags || [])
  const [newTag, setNewTag] = useState('')

  const handleAddTag = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: FlowMetadataEvent = { name, description, tags }

    if (isEditMode && onEdit && flow?.id) {
      onEdit({ id: flow.id, metadata: { ...data } })
    } else if (!isEditMode && onCreate) {
      onCreate({ metadata: data })
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
              {isEditMode ? 'Edit Flow' : 'Create New Flow'}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <Cross1Icon className="h-4 w-4" />
            </Button>
          </div>

          {flow?.id && (
            <div className="text-sm text-muted-foreground">
              Flow ID:
              {' '}
              {flow.id}
            </div>
          )}

          {/* Divider */}

          {/* Name Field */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TextIcon className="h-4 w-4 text-primary" />
              Flow Name
            </Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter flow name..."
              disabled={isLoading}
              required
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TextIcon className="h-4 w-4 text-primary" />
              Description
            </Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter flow description..."
              disabled={isLoading}
            />
          </div>

          {/* Tags Field */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FrameIcon className="h-4 w-4 text-primary" />
              Tags
            </Label>

            {/* Tags List */}
            <div className="flex flex-wrap gap-1 min-h-[24px]">
              <AnimatePresence mode="popLayout" initial={false}>
                {tags.map((tag, index) => (
                  <FlowTag
                    key={`${tag}-${index}`} // Добавляем индекс для уникальности ключа
                    tag={tag}
                    onRemove={(tagToRemove) => {
                      setTags(currentTags =>
                        currentTags.filter(t => t !== tagToRemove),
                      )
                    }}
                    interactive
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Add Tag Input */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (newTag && !tags.includes(newTag)) {
                      setTags(currentTags => [...currentTags, newTag])
                      setNewTag('')
                    }
                  }
                }}
                placeholder="Add tag..."
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddTag}
                disabled={isLoading || !newTag}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading
                ? (
                    <>
                      <Spinner className="mr-2" />
                      Working...
                    </>
                  )
                : isEditMode
                  ? (
                      'Save Changes'
                    )
                  : (
                      'Create Flow'
                    )}
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

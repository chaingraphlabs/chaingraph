/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowMetadata } from '@badaitech/chaingraph-types'
import { Cross2Icon, Pencil1Icon, Share1Icon } from '@radix-ui/react-icons'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FlowListItemProps {
  flow: FlowMetadata
  onDelete: () => void
  onEdit: (flow: FlowMetadata) => void
  onFork: (flow: FlowMetadata) => void
  selected?: boolean
  onSelect?: (flow: FlowMetadata) => void
  disabled: boolean
  isForkingFlow?: boolean
  canFork?: boolean
}

export function FlowListItem({
  flow,
  onDelete,
  onEdit,
  onFork,
  selected = false,
  onSelect,
  disabled,
  isForkingFlow = false,
  canFork = false,
}: FlowListItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showForkConfirmation, setShowForkConfirmation] = useState(false)

  if (!flow)
    return null

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Card
          onClick={() => onSelect?.(flow)}
          className={cn(
            'relative p-4 cursor-pointer group transition-all',
            selected && 'shadow-card-selected dark:shadow-card-selected-dark border-primary/50',
            !selected && 'hover:shadow-card-hover',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          {/* Content */}
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-medium leading-none">{flow.name}</h3>
                {flow.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {flow.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(flow)
                  }}
                  disabled={disabled}
                >
                  <Pencil1Icon className="h-4 w-4" />
                </Button>

                {canFork && (
                  showForkConfirmation
                    ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFork(flow)
                              setShowForkConfirmation(false)
                            }}
                            disabled={disabled || isForkingFlow}
                            className="h-8 px-2 text-xs"
                          >
                            {isForkingFlow ? 'Forking...' : 'Confirm'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowForkConfirmation(false)
                            }}
                            disabled={disabled || isForkingFlow}
                            className="h-8 px-2 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      )
                    : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowForkConfirmation(true)
                          }}
                          disabled={disabled}
                          title="Fork flow"
                        >
                          <Share1Icon className="h-4 w-4" />
                        </Button>
                      )
                )}

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e => e.stopPropagation()}
                      disabled={disabled}
                    >
                      <Cross2Icon className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Flow</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "
                        {flow.name}
                        "?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete()
                        }}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Tags & Metadata */}
            <div className="flex items-center justify-between gap-2">
              {/* Tags */}
              {flow.tags && flow.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-w-[calc(100%-4rem)]">
                  {' '}
                  {/* Reserve space for date */}
                  {flow.tags.slice(0, 3).map(tag => ( // Show only first 3 tags
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs"
                      title={tag}
                    >
                      {tag.length > 15 ? `${tag.slice(0, 15)}...` : tag}
                    </Badge>
                  ))}
                  {flow.tags.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      title={flow.tags.slice(3).join(', ')}
                    >
                      +
                      {flow.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Updated Date */}
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {new Date(flow.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  )
}

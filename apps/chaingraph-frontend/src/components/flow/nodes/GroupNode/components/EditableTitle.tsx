/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ScrollArea } from '@/components/ui'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

interface EditableTitleProps {
  value: string
  onChange: (value: string) => void
  className?: string
  isEditing?: boolean
  onEditingChange?: (isEditing: boolean) => void
}

export function EditableTitle({
  value,
  onChange,
  className,
  isEditing: externalIsEditing,
  onEditingChange,
}: EditableTitleProps) {
  const [internalIsEditing, setInternalIsEditing] = useState(false)
  const isEditing = externalIsEditing ?? internalIsEditing
  const setIsEditing = onEditingChange ?? setInternalIsEditing

  const [localValue, setLocalValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea)
      return

    // Reset height to single line to get correct scrollHeight
    textarea.style.height = 'auto'

    // Calculate new height (capped at 3 lines, approximately 72px)
    const newHeight = Math.min(textarea.scrollHeight, 172)
    textarea.style.height = `${newHeight}px`
  }, [])

  // Update height on content change
  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight()
    }
  }, [localValue, isEditing, adjustTextareaHeight])

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value)
    }
  }, [value, isEditing])

  const handleStartEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setLocalValue(value)
  }, [value, setIsEditing])

  const handleFinishEdit = useCallback(() => {
    setIsEditing(false)
    onChange(localValue.trim())
  }, [localValue, onChange, setIsEditing])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault() // Prevent new line on simple Enter
      handleFinishEdit()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setLocalValue(value)
    }
  }, [handleFinishEdit, value, setIsEditing])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()
    setLocalValue(e.target.value)
  }, [])

  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight()
    }
  }, [isEditing, adjustTextareaHeight])

  useEffect(() => {
    if (!isEditing)
      return

    function handleClickOutside(e: MouseEvent) {
      if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        handleFinishEdit()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing, handleFinishEdit])

  return (
    <div
      className={cn(
        'relative w-full h-full',
        'min-w-0',
      )}
      onMouseDown={e => e.stopPropagation()}
    >
      <AnimatePresence mode="wait">
        {isEditing
          ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="nodrag nopan w-full"
              >
                <Textarea
                  ref={textareaRef}
                  value={localValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleFinishEdit}
                  placeholder="Enter title"
                  className={cn(
                    'min-h-[28px] px-1 py-0.5',
                    'focus-visible:ring-1',
                    'bg-background/50 backdrop-blur-sm',
                    'font-inherit w-full',
                    'nodrag nopan',
                    'resize-none overflow-hidden',
                    'leading-tight',
                    className,
                  )}
                />
              </motion.div>
            )
          : (
              <div className="h-full flex items-start">

                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  onClick={handleStartEdit}
                  className={cn(
                    'cursor-text select-none',
                    'hover:bg-muted/30 rounded px-1',
                    'transition-colors duration-200',
                    'nodrag',
                    'break-words whitespace-pre-wrap',
                    'overflow-hidden text-ellipsis',
                    'w-fit max-w-full', // Make width fit content but not exceed container
                    'max-h-full', // Limit height to container
                    'block', // Make span behave like block
                    'text-ellipsis overflow-hidden', // Enable ellipsis
                    'font-medium',
                    className,
                  )}
                  style={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 'var(--lines, 999)', // Use CSS variable for dynamic line clamping
                  }}
                >
                  <ScrollArea
                    className="w-full h-full"
                    type="always"
                    scrollHideDelay={0}
                  >
                    {value || 'Untitled'}
                  </ScrollArea>
                </motion.span>
              </div>
            )}
      </AnimatePresence>
    </div>
  )
}

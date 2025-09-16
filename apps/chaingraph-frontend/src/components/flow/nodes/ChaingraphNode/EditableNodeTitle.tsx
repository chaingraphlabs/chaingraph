/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface EditableNodeTitleProps {
  value: string
  onChange: (value: string) => void
  className?: string
  style?: React.CSSProperties
}

export function EditableNodeTitle({
  value,
  onChange,
  className,
  style,
}: EditableNodeTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value)
    }
  }, [value, isEditing])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setLocalValue(value)
  }, [value])

  const handleFinishEdit = useCallback(() => {
    setIsEditing(false)
    onChange(localValue.trim())
  }, [localValue, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      handleFinishEdit()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setLocalValue(value)
    }
  }, [handleFinishEdit, value])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setLocalValue(e.target.value)
  }, [])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (!isEditing)
      return

    function handleClickOutside(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        handleFinishEdit()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing, handleFinishEdit])

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleFinishEdit}
        className={cn(
          'font-medium text-sm bg-transparent border-none outline-none',
          'focus:ring-1 focus:ring-white/30 rounded px-1',
          'min-w-0 w-full',
          'nodrag nopan',
          className,
        )}
        style={style}
      />
    )
  }

  return (
    <h3
      className={cn(
        'font-medium text-sm truncate cursor-text',
        'hover:bg-white/10 rounded px-1 transition-colors',
        // 'nodrag',
        className,
      )}
      style={style}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      {value}
    </h3>
  )
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface DeleteButtonProps {
  onClick: () => void
}

export function DeleteButton({ onClick }: DeleteButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex-shrink-0 p-1 rounded-md',
        'self-start group/delete',
        'hover:bg-destructive/20',
        'absolute -right-5 top-0',
      )}
      onClick={onClick}
    >
      <X
        className={cn(
          'size-3',
          'text-destructive/50',
          'group-hover/delete:text-destructive',
        )}
      />
      <div className={cn(
        'absolute inset-0 -z-10',
        'bg-destructive/5 opacity-0',
        'group-hover/delete:opacity-100',
        'rounded',
      )}
      />
    </button>
  )
}

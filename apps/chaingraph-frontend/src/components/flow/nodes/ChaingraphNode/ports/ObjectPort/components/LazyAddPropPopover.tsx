/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '@badaitech/chaingraph-types'
import { lazy, Suspense, useEffect, useState } from 'react'
import { PopoverContent } from '@/components/ui/popover'

// Lazy load the heavy popover content
const AddPropPopover = lazy(() =>
  import('./AddPropPopover').then(module => ({
    default: module.AddPropPopover,
  })),
)

interface Data {
  key: string
  config: IPortConfig
}

interface LazyAddPropPopoverProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Data) => void
  onDelete?: () => void
  nextOrder?: number
  nodeId: string
  portId: string
  editMode?: boolean
}

function PopoverContentFallback() {
  return (
    <PopoverContent className="flex flex-col w-[360px] h-[400px] items-center justify-center" align="start" side="bottom">
      <div className="text-sm text-muted-foreground">Loading...</div>
    </PopoverContent>
  )
}

export function LazyAddPropPopover({ isOpen, ...props }: LazyAddPropPopoverProps) {
  const [hasBeenOpened, setHasBeenOpened] = useState(false)

  useEffect(() => {
    if (isOpen && !hasBeenOpened) {
      setHasBeenOpened(true)
    }
  }, [isOpen, hasBeenOpened])

  // Don't render anything until opened at least once
  if (!hasBeenOpened) {
    return null
  }

  return (
    <Suspense fallback={<PopoverContentFallback />}>
      <AddPropPopover {...props} />
    </Suspense>
  )
}

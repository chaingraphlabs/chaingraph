/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { RefObject } from 'react'
import { useEffect } from 'react'
import { setIsOverCanvas } from '@/store/hotkeys'

/**
 * Hook to track whether the cursor is over the flow canvas.
 * Used by hotkeys to determine if they should be active.
 *
 * @param wrapperRef - Ref to the flow canvas wrapper div
 */
export function useCanvasHover(wrapperRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper)
      return

    const handleMouseEnter = () => {
      setIsOverCanvas(true)
    }

    const handleMouseLeave = () => {
      setIsOverCanvas(false)
    }

    wrapper.addEventListener('mouseenter', handleMouseEnter)
    wrapper.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      wrapper.removeEventListener('mouseenter', handleMouseEnter)
      wrapper.removeEventListener('mouseleave', handleMouseLeave)
      // Reset to false when unmounting
      setIsOverCanvas(false)
    }
  }, [wrapperRef])
}

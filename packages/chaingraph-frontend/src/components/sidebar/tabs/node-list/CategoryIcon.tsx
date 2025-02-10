/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryIconName } from '@badaitech/chaingraph-nodes'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@badaitech/chaingraph-nodes'

interface CategoryIconProps {
  name: CategoryIconName
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function CategoryIcon({
  name,
  size = 16,
  className,
  style,
}: CategoryIconProps) {
  const Icon = getCategoryIcon(name)
  return (
    <Icon
      className={cn('shrink-0', className)}
      style={{
        width: size,
        height: size,
        ...style,
      }}
    />
  )
}

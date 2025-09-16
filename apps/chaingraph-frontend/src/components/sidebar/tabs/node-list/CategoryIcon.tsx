/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryIconName } from '@badaitech/chaingraph-nodes'
import { getCategoryIcon } from '@badaitech/chaingraph-nodes'
import { cn } from '@/lib/utils'

interface CategoryIconProps {
  // FIXME: preserves autocomplete but allows any string,
  //  because chaingraph-types/CategoryMetadata has an icon of type string,
  //  otherwise it'll import CategoryIconName from chaingraph-nodes, which is an import cycle.
  //  Possible solution is to move this type to chaingraph-types.
  name: CategoryIconName | (string & {})
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

import type { CategoryIconName } from '@chaingraph/nodes/categories/icons'
import { cn } from '@/lib/utils.ts'
import { getCategoryIcon } from '@chaingraph/nodes/categories/icons'

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

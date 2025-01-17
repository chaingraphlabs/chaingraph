import type { CategoryIconName } from '@chaingraph/nodes/categories/icons'
import type { CategoryStyle } from '@chaingraph/types'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@chaingraph/nodes/categories/icons'
import { Cross1Icon } from '@radix-ui/react-icons'
import { useCallback } from 'react'

interface NodeHeaderProps {
  title: string
  icon: CategoryIconName
  style: CategoryStyle['light'] | CategoryStyle['dark']
  onDelete?: () => void
}

export function NodeHeader({
  title,
  icon,
  style,
  onDelete,
}: NodeHeaderProps) {
  const Icon = getCategoryIcon(icon)

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }, [onDelete])

  return (
    <div
      className={cn(
        'px-3 py-2 flex items-center justify-between',
        'border-b rounded-t-lg',
      )}
      style={{
        background: style.primary,
        borderBottom: `1px solid ${style.secondary}`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{
            background: `${style.text}20`,
          }}
        >
          <Icon
            className="w-4 h-4"
            style={{ color: style.text }}
          />
        </div>
        <h3
          className="font-medium text-sm truncate"
          style={{ color: style.text }}
        >
          {title}
        </h3>
      </div>

      <button
        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        style={{ color: style.text }}
        onClick={handleDelete}
      >
        <Cross1Icon className="w-3 h-3" />
      </button>
    </div>
  )
}

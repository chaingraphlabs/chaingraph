import { Cross1Icon } from '@radix-ui/react-icons'
import { Badge } from '@radix-ui/themes'
import { motion } from 'framer-motion'

interface FlowTagProps {
  tag: string
  onRemove?: (tag: string) => void
  interactive?: boolean
}

export function FlowTag({ tag, onRemove, interactive = false }: FlowTagProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={interactive ? { scale: 1.05 } : undefined}
      whileTap={interactive ? { scale: 0.95 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <Badge
        variant="soft"
        radius="full"
        className={`
          px-2 py-0.5
          bg-primary-50 dark:bg-primary-900/50
          text-primary-700 dark:text-primary-300
          border border-primary-100 dark:border-primary-800
          flex items-center gap-1
          ${interactive ? 'cursor-pointer' : ''}
          whitespace-nowrap
        `}
      >
        {tag}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(tag)
            }}
            className="p-0.5 rounded-full
                       hover:bg-primary-200/50 dark:hover:bg-primary-700/50
                       transition-colors duration-200"
          >
            <Cross1Icon className="w-3 h-3" />
          </button>
        )}
      </Badge>
    </motion.div>
  )
}

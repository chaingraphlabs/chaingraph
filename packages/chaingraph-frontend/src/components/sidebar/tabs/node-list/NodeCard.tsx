import type { CategoryMetadata, INode } from '@chaingraph/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from 'lucide-react'

interface NodeCardProps {
  node: INode
  categoryMetadata: CategoryMetadata
}

export function NodeCard({ node, categoryMetadata }: NodeCardProps) {
  // DnD setup
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.id,
    data: node,
  })

  const style = categoryMetadata.style
  const ports = [...node.getInputs(), ...node.getOutputs()]

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className={cn(
        'relative cursor-grab active:cursor-grabbing',
        'group hover:shadow-md transition-all duration-200',
        isDragging && 'shadow-lg ring-2 ring-primary',
      )}
      >
        {/* Header */}
        <div
          className="px-3 py-2 rounded-t-lg"
          style={{
            background: style.light.primary,
            borderBottom: `1px solid ${style.light.secondary}`,
          }}
        >
          <h3 className="font-medium text-sm" style={{ color: style.light.text }}>
            {node.metadata.title}
          </h3>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Description */}
          {node.metadata.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {node.metadata.description}
            </p>
          )}

          {/* Ports Preview */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {node.getInputs().length}
              {' '}
              inputs
            </span>
            <ArrowRightIcon className="w-3 h-3" />
            <span>
              {node.getOutputs().length}
              {' '}
              outputs
            </span>
          </div>

          {/* Tags */}
          {node.metadata.tags && node.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {node.metadata.tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] px-1"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Port Tooltips */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute -right-1 top-1/2 -translate-y-1/2
                          w-1 h-12 rounded-full bg-muted/50
                          opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </TooltipTrigger>
          <TooltipContent side="right" className="p-2 space-y-1">
            {ports.map(port => (
              <div key={port.config.id} className="text-xs flex items-center gap-2">
                <span>{port.config.direction}</span>
                <span className="font-medium">{port.config.title}</span>
              </div>
            ))}
          </TooltipContent>
        </Tooltip>
      </Card>
    </motion.div>
  )
}

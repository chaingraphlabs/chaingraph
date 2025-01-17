import type { CategorizedNodes } from '@chaingraph/nodes'
import type { CategoryIconName } from '../../../../../../chaingraph-nodes/src/categories/icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { getCategoryIcon } from '../../../../../../chaingraph-nodes/src/categories/icons'
import { NodeCard } from './NodeCard'

interface NodeCategoryProps {
  category: CategorizedNodes
  isExpanded?: boolean
}

export function NodeCategory({ category, isExpanded }: NodeCategoryProps) {
  const { metadata, nodes } = category

  // Get icon component from our registry
  const Icon = getCategoryIcon(metadata.icon as CategoryIconName)

  if (!Icon) {
    console.warn(`Icon "${metadata.icon}" not found`)
    return null
  }

  return (
    <Accordion type="single" defaultValue={isExpanded ? category.category : undefined}>
      <AccordionItem value={category.category} className="border-none">
        <AccordionTrigger className={cn(
          'flex items-center justify-between py-2 px-3',
          'rounded-lg hover:bg-accent transition-colors',
          'data-[state=open]:bg-accent',
        )}
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-md flex items-center justify-center',
              'bg-background border shadow-sm',
            )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-medium">{metadata.label}</span>
              <span className="text-xs text-muted-foreground">
                {nodes.length}
                {' '}
                {nodes.length === 1 ? 'node' : 'nodes'}
              </span>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-2 p-2"
          >
            {nodes.map(node => (
              <NodeCard
                key={node.id}
                node={node}
                categoryMetadata={metadata}
              />
            ))}
          </motion.div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

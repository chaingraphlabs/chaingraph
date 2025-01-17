import type { CategoryMetadata, INode } from '@chaingraph/types'
import { CategoryIcon } from '@/components/sidebar/tabs/node-list/CategoryIcon'
import { Command, CommandInput } from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { trpc } from '@chaingraph/frontend/api/trpc/client'
import { LayersIcon } from '@radix-ui/react-icons'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface NodeContextMenuProps {
  position: { x: number, y: number }
  onSelect: (node: INode, category: CategoryMetadata) => void
  onClose: () => void
}

export function NodeContextMenu({ position, onSelect, onClose }: NodeContextMenuProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState(position)

  // Calculate menu position to keep it in viewport
  useEffect(() => {
    if (!menuRef.current)
      return

    const menu = menuRef.current
    const menuRect = menu.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    let { x, y } = position

    // Check vertical overflow
    if (y + menuRect.height > viewportHeight) {
      y = Math.max(viewportHeight - menuRect.height - 10, 0) // 10px padding from bottom
    }

    // Check horizontal overflow
    if (x + menuRect.width > viewportWidth) {
      x = Math.max(viewportWidth - menuRect.width - 10, 0) // 10px padding from right
    }

    setMenuPosition({ x, y })
  }, [position])

  const { data: categorizedNodes } = trpc.nodeRegistry.getCategorizedNodes.useQuery()
  const { data: searchResults } = trpc.nodeRegistry.searchNodes.useQuery(searchQuery, {
    enabled: searchQuery.length > 0,
  })

  const categories = searchQuery ? searchResults : categorizedNodes

  return (
    <>
      {/* Overlay to catch clicks outside */}
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
      />

      {/* Menu */}
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{
          type: 'spring',
          duration: 0.3,
          bounce: 0.25,
          damping: 20,
          stiffness: 200,
        }}
        className={cn(
          'fixed z-50 w-64 rounded-lg border bg-popover shadow-md',
          'backdrop-blur-sm bg-opacity-98',
        )}
        style={{
          left: menuPosition.x,
          top: menuPosition.y,
          transformOrigin: 'top left',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search */}
        <div className="p-2 border-b">
          <Command className="rounded-md">
            <CommandInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Search nodes..."
              className="h-8"
              autoFocus
            />
          </Command>
        </div>

        {/* Node List */}
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {categories?.map(category => (
              <div key={category.category} className="mb-4 last:mb-0">
                {/* Category Header */}
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <CategoryIcon
                    name={category.metadata.icon}
                    size={16}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm font-medium">
                    {category.metadata.label}
                  </span>
                </div>

                {/* Nodes */}
                <div className="mt-1">
                  {category.nodes.map(node => (
                    <motion.div
                      key={node.id}
                      className={cn(
                        'flex items-center gap-2 px-4 py-1.5 rounded-sm text-sm',
                        'cursor-pointer hover:bg-accent',
                      )}
                      onClick={() => onSelect(node, category.metadata)}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.1 }}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: category.metadata.style.dark.text,
                          boxShadow: `0 1px 2px ${category.metadata.style.dark.text}40`,
                        }}
                      />
                      <span className="flex-1 truncate">
                        {node.metadata.title}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}

            {/* Empty State */}
            {(!categories || categories.length === 0) && (
              <div className="p-4 text-center text-muted-foreground">
                <LayersIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">
                  {searchQuery
                    ? `No nodes found matching "${searchQuery}"`
                    : 'No nodes available'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </>
  )
}

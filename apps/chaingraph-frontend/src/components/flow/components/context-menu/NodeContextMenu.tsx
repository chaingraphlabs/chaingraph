/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata, NodeMetadata } from '@badaitech/chaingraph-types'
import { CategoryIcon } from '@/components/sidebar/tabs/node-list/CategoryIcon'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useCategories } from '@/store/categories'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface NodeContextMenuProps {
  position: { x: number, y: number }
  onSelect: (node: NodeMetadata, category: CategoryMetadata) => void
  onClose: () => void
}

export function NodeContextMenu({ position, onSelect, onClose }: NodeContextMenuProps) {
  const { theme } = useTheme()
  const [search, setSearch] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState(position)

  const { categories } = useCategories()

  // Filter nodes based on search
  const filteredCategories = useMemo(() => {
    if (!search)
      return categories

    return categories.map(category => ({
      ...category,
      nodes: category.nodes.filter(node =>
        node.title?.toLowerCase().includes(search.toLowerCase())
        || node.description?.toLowerCase().includes(search.toLowerCase())
        || node.tags?.some(tag =>
          tag.toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    })).filter(category => category.nodes.length > 0)
  }, [categories, search])

  // Handle node selection
  const handleSelect = useCallback((node: NodeMetadata, categoryMetadata: CategoryMetadata) => {
    onSelect(node, categoryMetadata)
    onClose()
  }, [onSelect, onClose])

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

  return (
    <>
      {/* Overlay to catch clicks outside */}
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
      />

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
          'fixed z-50 w-64',
          'bg-popover text-popover-foreground',
          'rounded-md border shadow-md',
        )}
        style={{
          left: menuPosition.x,
          top: menuPosition.y,
          transformOrigin: 'top left',
        }}
        onClick={e => e.stopPropagation()}
      >
        <Command className="rounded-md">
          <CommandInput
            placeholder="Search nodes..."
            value={search}
            onValueChange={setSearch}
            autoFocus
          />

          <ScrollArea className="h-[300px]">
            {filteredCategories.map(category => (
              <CommandGroup
                key={category.category}
                heading={(
                  <div className="flex items-center gap-2">
                    <CategoryIcon
                      name={category.metadata.icon}
                      size={14}
                      style={{
                        color: theme === 'dark'
                          ? category.metadata.style.dark.text
                          : category.metadata.style.light.text,
                      }}
                    />
                    <span>{category.metadata.label}</span>
                  </div>
                )}
              >
                {category.nodes.map(node => (
                  <CommandItem
                    key={node.type}
                    value={`${category.category}:${node.title}`}
                    onSelect={() => handleSelect(node, category.metadata)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 p-0 h-auto font-normal"
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full shrink-0',
                          'ring-[1.5px] ring-background',
                          'shadow-sm',
                        )}
                        style={{
                          backgroundColor: theme === 'dark'
                            ? category.metadata.style.dark.text
                            : category.metadata.style.light.text,
                          boxShadow: `0 1px 3px ${
                            theme === 'dark'
                              ? category.metadata.style.dark.text
                              : category.metadata.style.light.text
                          }80`,
                        }}
                      />
                      <span>{node.title}</span>
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            <CommandEmpty>No nodes found.</CommandEmpty>
          </ScrollArea>
        </Command>
      </motion.div>
    </>
  )
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategorizedNodes } from '@badaitech/chaingraph-types'
import { CategoryIcon } from '@/components/sidebar/tabs/node-list/CategoryIcon'
import {
  useExpandedCategories,
} from '@/components/sidebar/tabs/node-list/hooks/useExpandedCategories'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Command, CommandInput } from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useCategories } from '@/store/categories'
import { LayersIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NodeCard } from './NodeCard'
import { NodeListSkeleton } from './NodeListSkeleton'

export function NodeList() {
  const [searchQuery, setSearchQuery] = useState('')

  const { isLoading, categories, getCategoryMetadata } = useCategories()

  // Memoize filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery)
      return categories

    return categories?.filter((category: CategorizedNodes) => {
      return category.nodes.some(node =>
        node.title?.toLowerCase().includes(searchQuery.toLowerCase())
        || node.description?.toLowerCase().includes(searchQuery.toLowerCase())
        || node.tags?.some(tag =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    })
  }, [searchQuery, categories])

  const availableCategories = useMemo(
    () => filteredCategories?.map(c => c.category) || [],
    [filteredCategories],
  )

  // Get expanded categories state
  const [expandedCategories, setExpandedCategories] = useExpandedCategories(availableCategories)

  if (isLoading) {
    return <NodeListSkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Compact Header */}
      <div className="p-2 border-b">
        <Command className="rounded-md border shadow-none">
          <div className="flex items-center">
            <CommandInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Search nodes..."
              className="h-7 border-0 focus:ring-0 px-1.5 text-sm"
            />
          </div>
        </Command>
      </div>

      {/* Node Categories */}
      <ScrollArea className="flex-1">
        <Accordion
          type="multiple"
          value={expandedCategories}
          onValueChange={setExpandedCategories}
          className="space-y-0.5 p-1"
        >
          {filteredCategories
            .filter(category => !category.metadata.hidden)
            .map(category => (
              <AccordionItem
                key={category.category}
                value={category.category}
                className="border-0"
              >
                <AccordionTrigger
                  className={cn(
                    'py-1 px-2 rounded-sm hover:bg-accent/50',
                    'hover:no-underline text-sm',
                    'data-[state=open]:bg-accent/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon
                      name={category.metadata.icon}
                      size={16}
                      className="text-muted-foreground"
                    />
                    <span className="font-medium">{category.metadata.label}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {category.nodes.length}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pt-1 pb-2">
                  <div className="space-y-1 pl-6">
                    {category.nodes.map(node => (
                      <NodeCard
                        key={node.type}
                        node={node}
                        categoryMetadata={category.metadata}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>

        {/* Empty State */}
        {filteredCategories?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <LayersIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">
              {searchQuery
                ? `No nodes found matching "${searchQuery}"`
                : 'No nodes available'}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

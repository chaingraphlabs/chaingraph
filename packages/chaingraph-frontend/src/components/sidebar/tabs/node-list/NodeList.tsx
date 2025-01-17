import { Command, CommandInput } from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { trpc } from '@chaingraph/frontend/api/trpc/client'
import { LayersIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { NodeCategory } from './NodeCategory'
import { NodeListSkeleton } from './NodeListSkeleton'

export function NodeList() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: categorizedNodes, isLoading } = trpc.nodeRegistry.getCategorizedNodes.useQuery()
  const { data: searchResults } = trpc.nodeRegistry.searchNodes.useQuery(searchQuery, {
    enabled: searchQuery.length > 0,
  })

  const nodes = searchQuery ? searchResults : categorizedNodes

  if (isLoading) {
    return <NodeListSkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <LayersIcon className="w-5 h-5" />
          Node Library
        </h2>

        {/* Search */}
        <Command className="rounded-lg border shadow-none">
          <div className="flex items-center px-3">
            <SearchIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <CommandInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Search nodes..."
              className="h-9 border-0 focus:ring-0 px-2"
            />
          </div>
        </Command>
      </div>

      {/* Node Categories */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {nodes?.map((category, index) => (
            <NodeCategory
              key={category.category}
              category={category}
              isExpanded={index === 0} // Первая категория раскрыта по умолчанию
            />
          ))}

          {/* Empty State */}
          {nodes?.length === 0 && (
            <div className={cn(
              'flex flex-col items-center justify-center py-12 px-4',
              'text-center text-muted-foreground',
            )}
            >
              <LayersIcon className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">
                {searchQuery
                  ? `No nodes found matching "${searchQuery}"`
                  : 'No nodes available'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

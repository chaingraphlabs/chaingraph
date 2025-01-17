import type { FlowContextMenuProps } from '@/components/flow/context-menu/types.ts'
import { CategoryIcon } from '@/components/sidebar/tabs/node-list/CategoryIcon'
import { Command, CommandInput } from '@/components/ui/command'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { trpc } from '@chaingraph/frontend/api/trpc/client'
import { LayersIcon } from '@radix-ui/react-icons'
import { useCallback, useState } from 'react'
import { useMenuPosition } from './useMenuPosition'

export function FlowContextMenu({ children, onNodeSelect }: FlowContextMenuProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { position, setPosition } = useMenuPosition()

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    console.log('Context menu triggered', e.clientX, e.clientY)

    setPosition({
      x: e.clientX,
      y: e.clientY,
      screenX: e.screenX,
      screenY: e.screenY,
    })
  }, [setPosition])

  const handleOpenChange = useCallback((open: boolean) => {
    console.log('Context menu open change:', open)
    if (!open) {
      setPosition(null)
    }
  }, [setPosition])

  const { data: categorizedNodes } = trpc.nodeRegistry.getCategorizedNodes.useQuery()
  const { data: searchResults } = trpc.nodeRegistry.searchNodes.useQuery(searchQuery, {
    enabled: searchQuery.length > 0,
  })

  const categories = searchQuery ? searchResults : categorizedNodes

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuTrigger
        className="h-full w-full"
        onContextMenu={handleContextMenu}
      >
        {children}
      </ContextMenuTrigger>

      <ContextMenuContent
        className="w-64"
      >
        {/* Search input */}
        <div className="p-2 border-b">
          <Command className="rounded-md">
            <CommandInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Search nodes..."
              className="h-8"
            />
          </Command>
        </div>

        {/* Nodes list */}
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

                {/* Category Nodes */}
                <div className="mt-1 space-y-1">
                  {category.nodes.map(node => (
                    <ContextMenuItem
                      key={node.id}
                      className="flex items-center gap-2 px-4 py-1.5 text-sm cursor-pointer"
                      onClick={() => {
                        if (position) {
                          onNodeSelect?.({
                            node,
                            categoryMetadata: category.metadata,
                            position,
                          })
                          setPosition(null)
                        }
                      }}
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
                    </ContextMenuItem>
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
      </ContextMenuContent>
    </ContextMenu>
  )
}

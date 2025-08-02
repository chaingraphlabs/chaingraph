/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MCPServerWithCapabilities } from '../store/types'
import { $mcpServersWithCapabilities } from '@/components/sidebar/tabs/mcp/store'
import {
  Accordion,
} from '@/components/ui/accordion'
import { Command, CommandInput } from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUnit } from 'effector-react'
import { Server } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MCPServerItem } from './MCPServerItem'

interface MCPServerListProps {
  onEditServer?: (server: MCPServerWithCapabilities) => void
}

export function MCPServerList({ onEditServer }: MCPServerListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const servers = useUnit($mcpServersWithCapabilities)

  // Filter servers based on search
  const filteredServers = useMemo(() => {
    if (!searchQuery)
      return servers

    return servers.filter((server) => {
      const query = searchQuery.toLowerCase()

      // Search in server title and URL
      if (server.title.toLowerCase().includes(query)
        || server.url.toLowerCase().includes(query)) {
        return true
      }

      // Search in tools
      if (server.tools?.some(tool =>
        tool.name.toLowerCase().includes(query)
        || tool.description?.toLowerCase().includes(query),
      )) {
        return true
      }

      // Search in resources
      if (server.resources?.some(resource =>
        resource.name.toLowerCase().includes(query)
        || resource.description?.toLowerCase().includes(query),
      )) {
        return true
      }

      // Search in prompts
      if (server.prompts?.some(prompt =>
        prompt.name.toLowerCase().includes(query)
        || prompt.description?.toLowerCase().includes(query),
      )) {
        return true
      }

      return false
    })
  }, [servers, searchQuery])

  // Auto-expand servers when searching
  const expandedServers = useMemo(() => {
    if (searchQuery) {
      return filteredServers.map(server => server.id)
    }
    return []
  }, [searchQuery, filteredServers])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search Header */}
      <div className="p-2 border-b">
        <Command className="rounded-md border shadow-none">
          <div className="flex items-center">
            <CommandInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Search servers, tools, resources..."
              className="h-7 border-0 focus:ring-0 px-1.5 text-sm"
            />
          </div>
        </Command>
      </div>

      {/* Server List */}
      <ScrollArea className="flex-1 overflow-hidden">
        {filteredServers.length > 0
          ? (
              <Accordion
                type="multiple"
                defaultValue={expandedServers}
                className="space-y-0.5 p-1 w-full"
              >
                {filteredServers.map(server => (
                  <MCPServerItem
                    key={server.id}
                    server={server}
                    searchQuery={searchQuery}
                    onEdit={onEditServer}
                  />
                ))}
              </Accordion>
            )
          : (
        /* Empty State */
              <div className="p-8 text-center text-muted-foreground">
                <Server className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">
                  {searchQuery
                    ? `No servers found matching "${searchQuery}"`
                    : 'No MCP servers configured'}
                </p>
              </div>
            )}
      </ScrollArea>
    </div>
  )
}

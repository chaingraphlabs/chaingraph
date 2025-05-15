/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { UserSession } from '../utils/api'
import { useState } from 'react'
import { Badge } from '../../../../ui/badge'
import { Card } from '../../../../ui/card'
import { Input } from '../../../../ui/input'
import { ScrollArea } from '../../../../ui/scroll-area'
import { useAgentList } from '../hooks/useAgentList'
import { Status } from './Status'

interface AgentSelectionStepProps {
  userSession: UserSession
  selectedAgentId: string
  onSelectAgent: (agentId: string) => Promise<void>
  onDeselectAgent?: () => void
  enabled: boolean
}

// Collection badge color mapping
const collectionBadgeColors: Record<string, string> = {
  not_deployed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
  deployed_privately: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
  deployed_to_space: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
}

export function AgentSelectionStep({
  userSession,
  selectedAgentId,
  onSelectAgent,
  onDeselectAgent,
  enabled,
}: AgentSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { agents, isLoading, error } = useAgentList(enabled ? userSession : '')

  // Filter agents based on search term
  const filteredAgents = agents.filter(agent =>
    agent.name?.toLowerCase().includes(searchTerm.toLowerCase())
    || agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
    || agent.collection_info?.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!enabled) {
    return (
      <Card className="p-2 bg-muted/30">
        <h3 className="text-sm font-medium text-muted-foreground">Agent Selection</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Connect with a valid user session first.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Select Agent</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {selectedAgentId ? 'Agent Selected' : 'Not Selected'}
          </Badge>
          {selectedAgentId && onDeselectAgent && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDeselectAgent()
              }}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <Input
        type="text"
        placeholder="Search agents..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="mb-2 h-8 text-sm"
        size={10}
      />

      <Status isLoading={isLoading} error={error} />

      {!isLoading && !error && (
        <ScrollArea className="pr-2">
          <div className="grid grid-cols-1 gap-2">
            {filteredAgents.length > 0
              ? (
                  filteredAgents.map(agent => (
                    <Card
                      key={agent.id}
                      className={`p-2 cursor-pointer transition-all hover:shadow-md ${selectedAgentId === agent.id ? 'border-2 border-primary' : ''
                      }`}
                      onClick={async () => await onSelectAgent(agent.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-6 h-6 rounded-full overflow-hidden bg-muted">
                          <img
                            src={agent.avatar || '/image/avatar/avatar-default.svg'}
                            alt={agent.name || 'Agent'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-medium truncate">{agent.name || 'Unnamed Agent'}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {agent.description || 'No description available'}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {/* Collection badge - always show this */}
                            {agent.collection_info && (
                              <Badge
                                variant="outline"
                                className={`text-xs px-1 py-0 ${collectionBadgeColors[agent.collection_info.id] || ''
                                }`}
                              >
                                {agent.collection_info.title}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )
              : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {searchTerm ? 'No agents match your search' : 'No agents available'}
                  </div>
                )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

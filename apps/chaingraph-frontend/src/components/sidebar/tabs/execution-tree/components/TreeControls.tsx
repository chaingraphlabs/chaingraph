/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ExecutionStatus } from '@/store/execution'
import { Maximize2, Minimize2, RotateCcw, Search } from 'lucide-react'

interface TreeControlsProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: ExecutionStatus | 'all'
  onStatusFilterChange: (status: ExecutionStatus | 'all') => void
  expandedAll: boolean
  onToggleExpandAll: () => void
  onRefresh: () => void
  className?: string
}

export function TreeControls({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  expandedAll,
  onToggleExpandAll,
  onRefresh,
  className,
}: TreeControlsProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search executions..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={value => onStatusFilterChange(value as ExecutionStatus | 'all')}
        >
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value={ExecutionStatus.IDLE}>Idle</SelectItem>
            <SelectItem value={ExecutionStatus.CREATING}>Creating</SelectItem>
            <SelectItem value={ExecutionStatus.CREATED}>Created</SelectItem>
            <SelectItem value={ExecutionStatus.RUNNING}>Running</SelectItem>
            <SelectItem value={ExecutionStatus.PAUSED}>Paused</SelectItem>
            <SelectItem value={ExecutionStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={ExecutionStatus.ERROR}>Error</SelectItem>
            <SelectItem value={ExecutionStatus.STOPPED}>Stopped</SelectItem>
          </SelectContent>
        </Select>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleExpandAll}
            title={expandedAll ? 'Collapse all' : 'Expand all'}
          >
            {expandedAll
              ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                )
              : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRefresh}
            title="Refresh"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

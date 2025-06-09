/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { Activity } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Activity className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">No executions yet</h3>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        Executions will appear here when you run a flow
      </p>
    </div>
  )
}

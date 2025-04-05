/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ScrollArea } from '@/components/ui/scroll-area'

export function EventList() {
  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No events recorded yet.
        </p>
      </div>
    </ScrollArea>
  )
}

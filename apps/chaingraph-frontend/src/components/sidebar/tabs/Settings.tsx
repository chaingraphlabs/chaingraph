/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useTheme } from '@/components/theme/hooks/useTheme'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { EdgeCurveSettings } from './settings/EdgeCurveSettings'

export function Settings() {
  const { theme, toggleTheme } = useTheme()

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="px-4 py-2 space-y-6">
        {/* Edge Curves */}
        <EdgeCurveSettings />

        <Separator />

        {/* Appearance */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Appearance</h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="text-xs">Dark Mode</Label>
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

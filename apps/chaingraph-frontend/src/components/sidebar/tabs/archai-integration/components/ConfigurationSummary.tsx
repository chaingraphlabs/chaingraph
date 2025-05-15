/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArchAIConfig } from '../../../../../store/archai/stores'
import { useState } from 'react'
import { Button } from '../../../../ui/button'
import { Card } from '../../../../ui/card'

interface ConfigurationSummaryProps {
  config: ArchAIConfig
  isComplete: boolean
}

export function ConfigurationSummary({ config, isComplete }: ConfigurationSummaryProps) {
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value)
    setCopySuccess(label)
    setTimeout(() => setCopySuccess(null), 2000)
  }

  const configItem = (label: string, value: string, hidden: boolean = false) => {
    if (!value)
      return null

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="text-xs font-medium">
            {label}
            :
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {hidden ? '••••••••' : value}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopy(value, label)}
          className="h-6 px-2 text-xs"
        >
          {copySuccess === label ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    )
  }

  if (!isComplete) {
    return null
  }

  return (
    <Card className="p-2 mt-2 bg-muted/30 space-y-1">
      <h3 className="text-sm font-medium mb-1">Configuration</h3>

      {configItem('User Session', config.userSession, true)}
      {configItem('Agent ID', config.agentID)}
      {configItem('Agent Session', config.agentSession, true)}
      {configItem('Chat ID', config.chatID)}
      {configItem('Message ID', String(config.messageID))}

      <div className="pt-1">
        <Button
          size="sm"
          variant="outline"
          className="w-full h-6 text-xs"
          onClick={() => {
            const configStr = Object.entries(config)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n')
            handleCopy(configStr, 'All Config')
          }}
        >
          {copySuccess === 'All Config' ? 'Copied All!' : 'Copy All Configuration'}
        </Button>
      </div>
    </Card>
  )
}

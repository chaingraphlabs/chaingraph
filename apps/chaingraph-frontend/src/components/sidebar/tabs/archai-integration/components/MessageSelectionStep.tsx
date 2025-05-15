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
import { useMessages } from '../hooks/useMessages'
import { formatDate } from '../utils/formatters'
import { Status } from './Status'

interface MessageSelectionStepProps {
  userSession: UserSession
  chatId: string
  selectedMessageId: string | number
  onSelectMessage: (messageId: string) => void
  onDeselectMessage?: () => void
  enabled: boolean
}

export function MessageSelectionStep({
  userSession,
  chatId,
  selectedMessageId,
  onSelectMessage,
  onDeselectMessage,
  enabled,
}: MessageSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { messages, isLoading, error } = useMessages(
    enabled ? userSession : '',
    chatId,
    100,
  )

  // Filter messages based on search term
  const filteredMessages = messages.filter(message =>
    message.text?.toLowerCase().includes(searchTerm.toLowerCase())
    || message.participant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
    || message.participant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    || message.participant?.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Allow message selection regardless of previous steps

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Select Message</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {selectedMessageId ? 'Message Selected' : 'Not Selected'}
          </Badge>
          {selectedMessageId && onDeselectMessage && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDeselectMessage()
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
        placeholder="Search messages..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="mb-2 h-8 text-sm"
        size={10}
      />

      <Status isLoading={isLoading} error={error} />

      {!isLoading && !error && (
        <ScrollArea className="h-full pr-2">
          <div className="grid grid-cols-1 gap-2">
            {filteredMessages.length > 0
              ? (
                  filteredMessages.map(message => (
                    <Card
                      key={message.id}
                      className={`p-2 cursor-pointer transition-all hover:shadow-md ${String(selectedMessageId) === String(message.id) ? 'border-2 border-primary' : ''
                      }`}
                      onClick={() => onSelectMessage(message.id)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 overflow-hidden">
                            {message.participant?.avatar && (
                              <div className="w-5 h-5 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                <img
                                  src={message.participant.avatar}
                                  alt={`${message.participant.first_name} ${message.participant.last_name}` || 'User'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <h4 className="text-sm font-medium truncate">{`${message.participant?.first_name} ${message.participant?.last_name}` || 'Unknown'}</h4>
                          </div>
                          {message.time && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatDate(message.time)}
                            </span>
                          )}
                        </div>

                        <p className="text-xs whitespace-normal line-clamp-2 break-words">
                          {message.text || 'Empty message'}
                        </p>

                        {message.attachments && message.attachments.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Files:</span>
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              {message.attachments.length}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )
              : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {searchTerm
                      ? 'No messages match your search'
                      : !chatId
                          ? 'No chat selected yet'
                          : 'No messages available in this chat'}
                  </div>
                )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

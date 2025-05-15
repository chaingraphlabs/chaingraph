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
import { useChatRooms } from '../hooks/useChatRooms'
import { formatDate } from '../utils/formatters'
import { Status } from './Status'

interface ChatSelectionStepProps {
  userSession: UserSession
  selectedChatId: string
  onSelectChat: (chatId: string) => void
  onDeselectChat?: () => void
  enabled: boolean
}

export function ChatSelectionStep({
  userSession,
  selectedChatId,
  onSelectChat,
  onDeselectChat,
  enabled,
}: ChatSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { chatRooms, isLoading, error } = useChatRooms(enabled ? userSession : '')

  // Filter chats based on search term
  const filteredChats = chatRooms.filter(chat =>
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase())
    || chat.last_message?.text?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Allow chat selection regardless of previous steps

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Select Chat</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {selectedChatId ? 'Chat Selected' : 'Not Selected'}
          </Badge>
          {selectedChatId && onDeselectChat && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDeselectChat()
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
        placeholder="Search chats..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="mb-2 h-8 text-sm"
        size={10}
      />

      <Status isLoading={isLoading} error={error} />

      {!isLoading && !error && (
        <ScrollArea className="h-full pr-2">
          <div className="grid grid-cols-1 gap-2">
            {filteredChats.length > 0
              ? (
                  filteredChats.map(chat => (
                    <Card
                      key={chat.id}
                      className={`p-2 cursor-pointer transition-all hover:shadow-md ${selectedChatId === chat.id ? 'border-2 border-primary' : ''
                      }`}
                      onClick={() => onSelectChat(chat.id)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium truncate">{chat.name || 'Unnamed Chat'}</h4>
                          {chat.updated_at && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(chat.updated_at)}
                            </span>
                          )}
                        </div>

                        {chat.last_message && (
                          <p className="text-xs text-muted-foreground line-clamp-1 border-l border-l-muted pl-2">
                            {chat.last_message.text || 'No messages'}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-1">
                          {chat.participants && chat.participants.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                {chat.participants.length}
                                <span className="hidden sm:inline"> participants</span>
                              </span>
                              {chat.participants.filter((participant) => {
                                return participant.username !== 'user'
                              }).map(participant => (
                                <Badge
                                  key={participant.participant_id}
                                  variant="outline"
                                  className="text-xs px-1 py-0.5"
                                >
                                  {`@${participant.username}` || 'Unknown'}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )
              : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {searchTerm
                      ? 'No chats match your search'
                      : !enabled
                          ? 'No agent selected yet, but you can still browse chats if available'
                          : 'No chats available'}
                  </div>
                )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

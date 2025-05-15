/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ConfigStep } from './components/StepIndicator'
import { fetchAgentSession } from '@/components/sidebar/tabs/archai-integration/utils/api'
import { Separator } from '@/components/ui/separator'
import { useCallback, useEffect, useState } from 'react'
import { AgentSelectionStep } from './components/AgentSelectionStep'
import { ChatSelectionStep } from './components/ChatSelectionStep'
import { ConfigurationSummary } from './components/ConfigurationSummary'
import { MessageSelectionStep } from './components/MessageSelectionStep'
import { StepIndicator } from './components/StepIndicator'
import { UserSessionStep } from './components/UserSessionStep'
import { useArchAIConfig } from './hooks/useArchAIConfig'

export function ArchAIIntegration() {
  // Get configuration and update functions
  const {
    config,
    isLoaded,
    isComplete,
    setUserSession,
    setAgentID,
    setAgentSession,
    setChatID,
    setMessageID,
  } = useArchAIConfig()

  // Current step and completed steps state
  const [currentStep, setCurrentStep] = useState<ConfigStep>('userSession')
  const [completedSteps, setCompletedSteps] = useState<ConfigStep[]>([])

  // Update completed steps whenever config changes
  useEffect(() => {
    if (!isLoaded)
      return

    const completed: ConfigStep[] = []

    if (config.userSession) {
      completed.push('userSession')
    }

    if (config.agentID && config.agentSession) {
      completed.push('agentSelection')
    }

    if (config.chatID) {
      completed.push('chatSelection')
    }

    if (config.messageID) {
      completed.push('messageSelection')
    }

    setCompletedSteps(completed)

    // No automatic step advancement - let users navigate freely
  }, [config, isLoaded])

  // Handle step change - allow any step once userSession is provided
  const handleStepChange = useCallback((step: ConfigStep) => {
    // Only check if userSession exists before allowing step change
    if (step !== 'userSession' && !config.userSession) {
      // If trying to navigate to any step other than userSession without a session,
      // force to userSession step
      setCurrentStep('userSession')
    } else {
      // Otherwise allow free navigation
      setCurrentStep(step)
    }
  }, [config.userSession])

  // Handle user session update
  const handleUserSessionUpdate = useCallback((userSession: string) => {
    setUserSession(userSession)

    // If user session is cleared, reset all other fields
    if (!userSession) {
      setAgentID('')
      setAgentSession('')
      setChatID('')
      setMessageID('') // Our adapter will convert this to 0
    } else {
      setCurrentStep('agentSelection')
    }
  }, [setUserSession, setAgentID, setAgentSession, setChatID, setMessageID])

  // Handle agent selection
  const handleAgentSelection = useCallback(async (agentId: string) => {
    setAgentID(agentId)

    // TODO: get agent session from the server
    try {
      const agentSession = await fetchAgentSession(
        config.userSession,
        agentId,
      )

      setAgentSession(agentSession.session)
      // if (agentId && agentSession.session) {
      //   setCurrentStep('chatSelection')
      // }
    } catch (error) {
      console.error('Error fetching agent session:', error)
      setAgentSession('')
    }
  }, [config.userSession, setAgentID, setAgentSession])

  // Handle agent deselection
  const handleAgentDeselection = useCallback(() => {
    setAgentID('')
    setAgentSession('')
    // When deselecting an agent, we should also clear chat and message selections
    setChatID('')
    setMessageID('')
  }, [setAgentID, setAgentSession, setChatID, setMessageID])

  // Handle chat selection
  const handleChatSelection = useCallback((chatId: string) => {
    setChatID(chatId)
    if (chatId) {
      setCurrentStep('messageSelection')
    }
  }, [setChatID])

  // Handle chat deselection
  const handleChatDeselection = useCallback(() => {
    setChatID('')
    // When deselecting a chat, we should also clear message selection
    setMessageID('')
  }, [setChatID, setMessageID])

  // Handle message selection
  const handleMessageSelection = useCallback((messageId: string) => {
    // Our adapter will handle the conversion to number
    setMessageID(messageId)
  }, [setMessageID])

  // Handle message deselection
  const handleMessageDeselection = useCallback(() => {
    setMessageID('')
  }, [setMessageID])

  // If configuration is not loaded yet, show nothing
  if (!isLoaded) {
    return null
  }

  return (
    <div className="p-2 space-y-3">
      <div>
        <h2 className="text-base font-semibold">ArchAI Integration</h2>
        <p className="text-xs text-muted-foreground">
          Connect ChainGraph with your ArchAI platform.
          Once authenticated, select specific agents, chat histories, and messages that serve as
          context for ArchAI nodes in your workflows. This integration enables seamless
          conversation processing, message creation,
          and variable management without leaving ChainGraph.
        </p>
      </div>

      <Separator className="my-1" />

      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepChange}
      />

      <div className="space-y-4">
        {currentStep === 'userSession' && (
          <UserSessionStep
            userSession={config.userSession}
            onUpdate={handleUserSessionUpdate}
          />
        )}

        {currentStep === 'agentSelection' && (
          <AgentSelectionStep
            userSession={config.userSession}
            selectedAgentId={config.agentID}
            onSelectAgent={handleAgentSelection}
            onDeselectAgent={handleAgentDeselection}
            enabled={!!config.userSession}
          />
        )}

        {currentStep === 'chatSelection' && (
          <ChatSelectionStep
            userSession={config.userSession}
            selectedChatId={config.chatID}
            onSelectChat={handleChatSelection}
            onDeselectChat={handleChatDeselection}
            enabled={!!config.userSession}
          />
        )}

        {currentStep === 'messageSelection' && (
          <MessageSelectionStep
            userSession={config.userSession}
            chatId={config.chatID}
            selectedMessageId={config.messageID}
            onSelectMessage={handleMessageSelection}
            onDeselectMessage={handleMessageDeselection}
            enabled={!!config.userSession && !!config.chatID}
          />
        )}
      </div>

      {config.userSession && <ConfigurationSummary config={config} isComplete={isComplete} />}
    </div>
  )
}

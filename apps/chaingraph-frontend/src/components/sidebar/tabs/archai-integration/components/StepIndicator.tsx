/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { Badge } from '../../../../ui/badge'

export type ConfigStep =
  | 'userSession'
  | 'agentSelection'
  | 'chatSelection'
  | 'messageSelection'

interface StepIndicatorProps {
  currentStep: ConfigStep
  completedSteps: ConfigStep[]
  onStepClick?: (step: ConfigStep) => void
}

export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  const steps: Array<{ id: ConfigStep, label: string }> = [
    { id: 'userSession', label: 'User Session' },
    { id: 'agentSelection', label: 'Agent' },
    { id: 'chatSelection', label: 'Chat' },
    { id: 'messageSelection', label: 'Message' },
  ]

  // Check if user session exists to determine if non-session steps are clickable
  const userSessionExists = completedSteps.includes('userSession')

  return (
    <div className="flex items-center gap-1 mb-4">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id)
        const isCurrent = currentStep === step.id

        // Steps are clickable if:
        // 1. This is the userSession step (always clickable)
        // 2. userSession exists (allowing free navigation between steps once session is provided)
        const isClickable = onStepClick && (step.id === 'userSession' || userSessionExists)

        // Determine the variant based on step status
        let variant: 'default' | 'outline' | 'secondary' = 'outline'
        if (isCurrent)
          variant = 'default'
        else if (isCompleted)
          variant = 'secondary'

        return (
          <Badge
            key={step.id}
            variant={variant}
            className={`
              text-xs px-2 py-0.5 whitespace-nowrap
              ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default opacity-70'}
            `}
            onClick={() => isClickable && onStepClick(step.id)}
          >
            {index + 1}
            .
            {step.label}
          </Badge>
        )
      })}
    </div>
  )
}

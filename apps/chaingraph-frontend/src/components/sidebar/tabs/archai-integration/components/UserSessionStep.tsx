/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useState } from 'react'
import { Alert, AlertDescription } from '../../../../ui/alert'
import { Badge } from '../../../../ui/badge'
import { Button } from '../../../../ui/button'
import { Card } from '../../../../ui/card'
import { Input } from '../../../../ui/input'
import { Label } from '../../../../ui/label'
import { useUserProfile } from '../hooks/useUserProfile'
import { Status } from './Status'

interface UserSessionStepProps {
  userSession: string
  onUpdate: (userSession: string) => void
}

export function UserSessionStep({ userSession, onUpdate }: UserSessionStepProps) {
  // Local state for the input field
  const [inputValue, setInputValue] = useState(userSession)

  // Fetch profile to validate the user session
  const { isLoading, error, profile } = useUserProfile(userSession)

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  // Handle session update
  const handleSave = () => {
    onUpdate(inputValue)
  }

  // Handle clearing the session
  const handleClear = () => {
    setInputValue('')
    onUpdate('')
  }

  // Check if the session is valid
  const isSessionValid = !!profile && !error

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">User Session</h3>
        {isSessionValid && (
          <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
            Connected
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="userSession">Session Token</Label>
        <div className="flex gap-2">
          <Input
            id="userSession"
            type="password"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter token"
            className="flex-1 h-8 text-sm"
            size={10}
          />
          <Button
            onClick={handleSave}
            disabled={isLoading || !inputValue || inputValue === userSession}
            size="sm"
            className="h-8 px-2"
          >
            {isLoading ? 'Validating...' : 'Connect'}
          </Button>
          {userSession && (
            <Button
              onClick={handleClear}
              variant="destructive"
              size="sm"
              className="h-8 px-2"
            >
              Clear
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Enter your ArchAI session token to connect to the API
        </p>
      </div>

      <Status isLoading={isLoading} error={error} />

      {isSessionValid && profile && (
        <Card className="p-2 bg-muted/50">
          <div className="flex items-center gap-2">
            {profile.avatar && (
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img src={profile.avatar} alt="User avatar" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="overflow-hidden">
              <h4 className="text-sm font-medium truncate">{profile.name || 'User'}</h4>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
          </div>
        </Card>
      )}

      {!userSession && (
        <Alert className="mt-2">
          <AlertDescription>
            You need to provide a valid user session to continue with the configuration.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

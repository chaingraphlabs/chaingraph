/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { Alert, AlertTitle } from '../../../../ui/alert'
import { Skeleton } from '../../../../ui/skeleton'

interface StatusProps {
  isLoading: boolean
  error: Error | null
  loadingRows?: number
  showAlert?: boolean
}

/**
 * Component for displaying loading states and errors
 */
export function Status({ isLoading, error, loadingRows = 3, showAlert = true }: StatusProps) {
  if (isLoading) {
    return (
      <div className="w-full space-y-1">
        {Array.from({ length: loadingRows }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    )
  }

  if (error && showAlert) {
    return (
      <Alert variant="destructive" className="my-1 p-2 max-w-[450px]">
        <AlertTitle className="text-sm">Error</AlertTitle>
        <p className="text-xs">{error.message}</p>
      </Alert>
    )
  }

  return null
}

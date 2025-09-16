/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ErrorMessageProps {
  title?: string
  children: React.ReactNode
}

export function ErrorMessage({ title = 'Error', children }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className="mx-4">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {children}
      </AlertDescription>
    </Alert>
  )
}

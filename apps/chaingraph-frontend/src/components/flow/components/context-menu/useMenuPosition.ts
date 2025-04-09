/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { use } from 'react'
import { MenuPositionContext } from './MenuPositionContext'

export function useMenuPosition() {
  const context = use(MenuPositionContext)
  if (!context) {
    throw new Error('useMenuPosition must be used within MenuPositionProvider')
  }
  return context
}

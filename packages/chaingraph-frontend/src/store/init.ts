/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { initializeCategoriesFx } from '@/store/categories/init'
import { initializeFlowsFx } from '@/store/flow/init'
import './flow/init'
import './nodes/init'
import './categories/init'
import './edges/init'
import './execution/init'
import './ports/init'

/**
 * Initialize all stores and load initial data
 */
export async function initializeStores() {
  try {
    // Initialize stores in parallel
    await Promise.all([
      initializeCategoriesFx(),
      initializeFlowsFx(),
    ])

    console.log('Stores initialized successfully')
  } catch (error) {
    console.error('Failed to initialize stores:', error)
    throw error
  }
}

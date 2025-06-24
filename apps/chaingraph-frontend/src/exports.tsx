/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

'use client'

import 'reflect-metadata'

/**
 * Import this CSS file to use the ChainGraph components:
 * import '@badaitech/chaingraph-frontend/style.css';
 */

import '@radix-ui/themes/styles.css'
import '@xyflow/react/dist/style.css'
import './index.css'

import './safelist/tailwind-safelist' // Import the safelist file
import './safelist/shadcn-safelist' // Import the safelist file

export * from './components/dnd'
export * from './components/flow'
export * from './components/sidebar'
export * from './components/ui'
export { RootProvider } from './providers/RootProvider'
export * from './providers/ZoomProvider'
export * from './store'

// External Integration Utils
export {
  clearAllExternalIntegrations,
  getAllExternalIntegrationConfigurations,
  getConfiguredExternalIntegrationKeys,
  getExternalIntegrationConfig,
  getExternalIntegrationManager,
  getRegisteredExternalIntegrations,
  hasExternalIntegration,
  registerExternalIntegration,
  removeExternalIntegration,
  setupExternalIntegration,
  setupMultipleExternalIntegrations,
  useExternalIntegrationConfig,
  validateAllExternalIntegrationConfigurations,
} from './store/execution'

export type {
  ExternalIntegrationConfig,
  IntegrationConfigDefinition,
  UseExternalIntegrationConfigReturn,
} from './store/execution'

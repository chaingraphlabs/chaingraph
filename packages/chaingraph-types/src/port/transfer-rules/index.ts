/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Rule engine
export { RuleBuilder, TransferEngine } from './engine'

// Main integration module
export {
  canConnect,
  getDefaultTransferEngine,
  getTransferRulesCompatibilityChecker,
  resetDefaultEngine,
  transfer,
  TransferRulesCompatibilityAdapter,
} from './integration'

// Predicates library
export { Predicates } from './predicates'

// Default rules
export { createDefaultTransferEngine, defaultTransferRules } from './rules/default-rules'

// Strategies library
export { Strategies } from './strategies'

// Core types
export type {
  PortPredicate,
  TransferContext,
  TransferEngineOptions,
  TransferResult,
  TransferRule,
  TransferStrategy,
} from './types'

// Utilities
export {
  areTypesCompatible,
  getEffectiveType,
  resolvePortConfig,
  unwrapAnyPort,
} from './utils/port-resolver'

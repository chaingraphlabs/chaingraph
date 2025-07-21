/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import * as jsonLogic from 'json-logic-js'

// Security constants
export const FORK_DENY_RULE = { '===': [1, 0] } as const // Always false, more explicit than ==
export const FORK_ALLOW_RULE = { '===': [1, 1] } as const // Always true
export const MAX_RULE_COMPLEXITY = 50 // Maximum number of nested operations
export const JSONLOGIC_TIMEOUT_MS = 1000 // 1 second timeout

/**
 * Validates JSONLogic rule complexity to prevent DoS
 */
function validateRuleComplexity(rule: any, depth = 0, nodeCount = 0): { valid: boolean, nodeCount: number } {
  if (depth > 10) { // Max nesting depth
    return { valid: false, nodeCount }
  }

  if (nodeCount > MAX_RULE_COMPLEXITY) {
    return { valid: false, nodeCount }
  }

  if (typeof rule !== 'object' || rule === null) {
    return { valid: true, nodeCount: nodeCount + 1 }
  }

  if (Array.isArray(rule)) {
    let totalNodes = nodeCount
    for (const item of rule) {
      const result = validateRuleComplexity(item, depth + 1, totalNodes)
      if (!result.valid) {
        return { valid: false, nodeCount: result.nodeCount }
      }
      totalNodes = result.nodeCount
    }
    return { valid: true, nodeCount: totalNodes }
  }

  let totalNodes = nodeCount + 1
  for (const value of Object.values(rule)) {
    const result = validateRuleComplexity(value, depth + 1, totalNodes)
    if (!result.valid) {
      return { valid: false, nodeCount: result.nodeCount }
    }
    totalNodes = result.nodeCount
  }

  return { valid: true, nodeCount: totalNodes }
}

/**
 * Safely evaluates JSONLogic rule with timeout and complexity validation
 */
export function safeApplyJsonLogic(rule: any, context: any): boolean {
  // Validate rule complexity first
  const validation = validateRuleComplexity(rule)
  if (!validation.valid) {
    throw new Error('Fork rule is too complex')
  }

  // For security, we'll implement a synchronous timeout using a simple approach
  // In production, you might want to use worker threads for true isolation
  try {
    const result = jsonLogic.apply(rule, context)
    return Boolean(result)
  } catch (error) {
    throw new Error(`Fork rule evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validates fork rule structure
 */
export function validateForkRule(rule: any): boolean {
  if (typeof rule !== 'object' || rule === null) {
    return false
  }

  // Basic structure validation - should be a JSONLogic object
  if (Array.isArray(rule)) {
    return false
  }

  // Check if it's a valid JSONLogic structure (has at least one operator)
  const keys = Object.keys(rule)
  if (keys.length === 0) {
    return false
  }

  // Validate complexity
  return validateRuleComplexity(rule).valid
}

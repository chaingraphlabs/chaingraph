/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, PortAny, PortBoolean, PortEnum } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

/**
 * Comparison operators supported by the Branch node
 */
export enum ComparisonOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_THAN_OR_EQUALS = 'greaterThanOrEquals',
  LESS_THAN_OR_EQUALS = 'lessThanOrEquals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
}

/**
 * Readable labels for each comparison operator
 */
const OperatorLabels: Record<ComparisonOperator, string> = {
  [ComparisonOperator.EQUALS]: 'Equals (=)',
  [ComparisonOperator.NOT_EQUALS]: 'Not Equals (≠)',
  [ComparisonOperator.GREATER_THAN]: 'Greater Than (>)',
  [ComparisonOperator.LESS_THAN]: 'Less Than (<)',
  [ComparisonOperator.GREATER_THAN_OR_EQUALS]: 'Greater Than or Equals (≥)',
  [ComparisonOperator.LESS_THAN_OR_EQUALS]: 'Less Than or Equals (≤)',
  [ComparisonOperator.CONTAINS]: 'Contains',
  [ComparisonOperator.NOT_CONTAINS]: 'Not Contains',
  [ComparisonOperator.STARTS_WITH]: 'Starts With',
  [ComparisonOperator.ENDS_WITH]: 'Ends With',
}

@Node({
  type: 'BranchNode',
  title: 'Branch',
  description: 'Controls flow based on comparing values of any type',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'condition', 'branch', 'compare', 'logic', 'any'],
})
class BranchNode extends BaseNode {
  @Input()
  @PortAny({
    title: 'Left Value',
    description: 'First value to compare (any type)',
  })
  leftValue: any = null

  @Input()
  @PortEnum({
    title: 'Operator',
    description: 'Comparison operator',
    options: Object.values(ComparisonOperator).map(op => ({
      id: op,
      type: 'string',
      defaultValue: op,
      title: OperatorLabels[op],
    })),
    defaultValue: ComparisonOperator.EQUALS,
  })
  operator: ComparisonOperator = ComparisonOperator.EQUALS

  @Input()
  @PortAny({
    title: 'Right Value',
    description: 'Second value to compare with (any type)',
  })
  rightValue: any = null

  @Output()
  @PortBoolean({
    title: 'Result',
    description: 'Comparison result (true/false)',
  })
  result: boolean = false

  /**
   * Perform comparison based on the selected operator
   */
  private compare(left: any, operator: ComparisonOperator, right: any): boolean {
    // For string-specific operations, convert to strings if needed
    const leftStr = typeof left === 'string' ? left : String(left ?? '')
    const rightStr = typeof right === 'string' ? right : String(right ?? '')

    // For numeric operations, try to convert to numbers if both are numeric
    const leftNum = !Number.isNaN(Number(left)) ? Number(left) : null
    const rightNum = !Number.isNaN(Number(right)) ? Number(right) : null
    const bothNumbers = leftNum !== null && rightNum !== null

    // Handle different comparison operators
    switch (operator) {
      case ComparisonOperator.EQUALS:
        // Direct equality comparison that handles different types
        if (left === null && right === null)
          return true
        if (left === null || right === null)
          return false

        // If both can be numbers, compare as numbers
        if (bothNumbers)
          return leftNum === rightNum

        // Otherwise do a loose equality check
        return left === right

      case ComparisonOperator.NOT_EQUALS:
        // Direct inequality comparison that handles different types
        if (left === null && right === null)
          return false
        if (left === null || right === null)
          return true

        // If both can be numbers, compare as numbers
        if (bothNumbers)
          return leftNum !== rightNum

        // Otherwise do a loose inequality check
        return left !== right

      case ComparisonOperator.GREATER_THAN:
        // If both can be treated as numbers, do numeric comparison
        if (bothNumbers)
          return leftNum > rightNum

        // Fall back to string comparison
        return leftStr > rightStr

      case ComparisonOperator.LESS_THAN:
        // If both can be treated as numbers, do numeric comparison
        if (bothNumbers)
          return leftNum < rightNum

        // Fall back to string comparison
        return leftStr < rightStr

      case ComparisonOperator.GREATER_THAN_OR_EQUALS:
        // If both can be treated as numbers, do numeric comparison
        if (bothNumbers)
          return leftNum >= rightNum

        // Fall back to string comparison
        return leftStr >= rightStr

      case ComparisonOperator.LESS_THAN_OR_EQUALS:
        // If both can be treated as numbers, do numeric comparison
        if (bothNumbers)
          return leftNum <= rightNum

        // Fall back to string comparison
        return leftStr <= rightStr

      case ComparisonOperator.CONTAINS:
        // Check if left string contains right string
        return leftStr.includes(rightStr)

      case ComparisonOperator.NOT_CONTAINS:
        // Check if left string does not contain right string
        return !leftStr.includes(rightStr)

      case ComparisonOperator.STARTS_WITH:
        // Check if left string starts with right string
        return leftStr.startsWith(rightStr)

      case ComparisonOperator.ENDS_WITH:
        // Check if left string ends with right string
        return leftStr.endsWith(rightStr)

      default:
        return false
    }
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.result = this.compare(this.leftValue, this.operator, this.rightValue)
    return {}
  }
}

export default BranchNode

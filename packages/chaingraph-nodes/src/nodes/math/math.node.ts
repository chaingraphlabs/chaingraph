/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { Output } from '@badaitech/chaingraph-types'
import { BaseNode, Node, Passthrough, PortEnum, PortNumber } from '@badaitech/chaingraph-types'
import { Decimal } from 'decimal.js'
import { NODE_CATEGORIES } from '../../categories'

/**
 * Supported mathematical operations
 */
enum MathOperation {
  Add = 'add',
  Subtract = 'subtract',
  Multiply = 'multiply',
  Divide = 'divide',
  Modulo = 'modulo',
  Power = 'power',
  Min = 'min',
  Max = 'max',
  Average = 'average',
  AbsoluteDifference = 'absolute_difference',
  Percentage = 'percentage',
  LogBase = 'log_base',
}

@Node({
  type: 'MathNode',
  title: 'Math',
  description: 'Performs mathematical operations on two numbers',
  category: NODE_CATEGORIES.MATH,
  tags: ['math', 'calculator', 'arithmetic', 'operations'],
})
class MathNode extends BaseNode {
  @Passthrough()
  @PortNumber({
    title: 'A',
    description: 'First number',
  })
  a: number = 0

  @Passthrough()
  @PortNumber({
    title: 'B',
    description: 'Second number',
  })
  b: number = 0

  @Passthrough()
  @PortEnum({
    title: 'Operation',
    description: 'Mathematical operation to perform',
    options: [
      { id: MathOperation.Add, type: 'string', defaultValue: MathOperation.Add, title: 'Add (A + B)' },
      { id: MathOperation.Subtract, type: 'string', defaultValue: MathOperation.Subtract, title: 'Subtract (A - B)' },
      { id: MathOperation.Multiply, type: 'string', defaultValue: MathOperation.Multiply, title: 'Multiply (A × B)' },
      { id: MathOperation.Divide, type: 'string', defaultValue: MathOperation.Divide, title: 'Divide (A ÷ B)' },
      { id: MathOperation.Modulo, type: 'string', defaultValue: MathOperation.Modulo, title: 'Modulo (A % B)' },
      { id: MathOperation.Power, type: 'string', defaultValue: MathOperation.Power, title: 'Power (A ^ B)' },
      { id: MathOperation.Min, type: 'string', defaultValue: MathOperation.Min, title: 'Min (minimum of A, B)' },
      { id: MathOperation.Max, type: 'string', defaultValue: MathOperation.Max, title: 'Max (maximum of A, B)' },
      { id: MathOperation.Average, type: 'string', defaultValue: MathOperation.Average, title: 'Average ((A + B) ÷ 2)' },
      { id: MathOperation.AbsoluteDifference, type: 'string', defaultValue: MathOperation.AbsoluteDifference, title: 'Absolute Difference (|A - B|)' },
      { id: MathOperation.Percentage, type: 'string', defaultValue: MathOperation.Percentage, title: 'Percentage ((A ÷ B) × 100)' },
      { id: MathOperation.LogBase, type: 'string', defaultValue: MathOperation.LogBase, title: 'Log Base (log_B(A))' },
    ],
  })
  operation?: MathOperation

  @Output()
  @PortNumber({
    title: 'Result',
    description: 'Result of the mathematical operation',
  })
  result: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Convert inputs to Decimal for precise calculations
    const decimalA = Number.isFinite(this.a) ? new Decimal(this.a) : new Decimal(0)
    const decimalB = Number.isFinite(this.b) ? new Decimal(this.b) : new Decimal(0)

    let resultDecimal: Decimal

    switch (this.operation) {
      case MathOperation.Add:
        resultDecimal = decimalA.plus(decimalB)
        break

      case MathOperation.Subtract:
        resultDecimal = decimalA.minus(decimalB)
        break

      case MathOperation.Multiply:
        resultDecimal = decimalA.times(decimalB)
        break

      case MathOperation.Divide:
        if (decimalB.isZero()) {
          throw new Error('Division by zero is not allowed')
        }
        resultDecimal = decimalA.dividedBy(decimalB)
        break

      case MathOperation.Modulo:
        if (decimalB.isZero()) {
          throw new Error('Modulo by zero is not allowed')
        }
        resultDecimal = decimalA.modulo(decimalB)
        break

      case MathOperation.Power:
        // Check for valid power operation
        if (decimalA.isNegative() && !decimalB.isInteger()) {
          throw new Error('Cannot raise negative number to non-integer power')
        }
        resultDecimal = decimalA.pow(decimalB)
        break

      case MathOperation.Min:
        resultDecimal = Decimal.min(decimalA, decimalB)
        break

      case MathOperation.Max:
        resultDecimal = Decimal.max(decimalA, decimalB)
        break

      case MathOperation.Average:
        resultDecimal = decimalA.plus(decimalB).dividedBy(2)
        break

      case MathOperation.AbsoluteDifference:
        resultDecimal = decimalA.minus(decimalB).abs()
        break

      case MathOperation.Percentage:
        if (decimalB.isZero()) {
          throw new Error('Cannot calculate percentage with zero denominator')
        }
        resultDecimal = decimalA.dividedBy(decimalB).times(100)
        break

      case MathOperation.LogBase:
        if (decimalB.lessThanOrEqualTo(0) || decimalB.equals(1)) {
          throw new Error('Log base must be positive and not equal to 1')
        }
        if (decimalA.lessThanOrEqualTo(0)) {
          throw new Error('Cannot take logarithm of non-positive number')
        }
        // log_b(a) = ln(a) / ln(b)
        resultDecimal = decimalA.ln().dividedBy(decimalB.ln())
        break

      default:
        throw new Error(`Unknown operation: ${this.operation}`)
    }

    // Check for invalid results
    if (!resultDecimal.isFinite()) {
      throw new Error('Result is not a finite number')
    }

    // Convert back to number for output
    this.result = resultDecimal.toNumber()

    return {}
  }
}

export default MathNode

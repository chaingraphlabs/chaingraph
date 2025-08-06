/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArrayPortConfig, ObjectPortConfig } from '../base'
import type { ObjectPort } from '../instances'
import type { TransferContext, TransferResult, TransferStrategy } from './types'
import { deepCopy } from '../../utils'
import { AnyPort } from '../instances'
import { unwrapAnyPort } from './utils/port-resolver'

/**
 * Library of reusable transfer strategies
 */
export const Strategies = {
  // ============================================
  // Basic Transfer Strategies
  // ============================================

  /**
   * Transfer only the value from source to target
   */
  value: (ctx: TransferContext): TransferResult => {
    try {
      const value = ctx.sourcePort.getValue() ?? ctx.sourceConfig.defaultValue ?? undefined
      ctx.targetPort.setValue(deepCopy(value))
      ctx.targetNode.updatePort(ctx.targetPort)

      return {
        success: true,
        valueTransferred: true,
        message: 'Value transferred successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: `Failed to transfer value: ${error}`,
      }
    }
  },

  /**
   * Transfer object schema from source to target
   */
  objectSchema: (ctx: TransferContext): TransferResult => {
    try {
      // Verify both ports are objects or AnyPort with object underlying
      const sourceConfig = ctx.sourcePort instanceof AnyPort
        ? unwrapAnyPort(ctx.sourceConfig) || ctx.sourceConfig
        : ctx.sourceConfig

      const targetConfig = ctx.targetPort instanceof AnyPort
        ? unwrapAnyPort(ctx.targetConfig) || ctx.targetConfig
        : ctx.targetConfig

      if (sourceConfig.type !== 'object' || targetConfig.type !== 'object') {
        return {
          success: false,
          message: 'Both ports must be object type for schema transfer',
        }
      }

      // Check if target schema is mutable
      const targetObjectConfig = targetConfig as ObjectPortConfig
      if (!targetObjectConfig.isSchemaMutable) {
        return {
          success: false,
          message: 'Target object schema is not mutable',
        }
      }

      // Perform schema copy
      ctx.targetNode.copyObjectSchemaTo(
        ctx.sourceNode,
        ctx.sourcePort as ObjectPort | AnyPort,
        ctx.targetPort as ObjectPort | AnyPort,
        true,
      )

      return {
        success: true,
        schemaTransferred: true,
        message: 'Object schema transferred successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: `Failed to transfer object schema: ${error}`,
      }
    }
  },

  /**
   * Transfer array item configuration
   */
  arrayItemConfig: (ctx: TransferContext): TransferResult => {
    try {
      if (ctx.sourceConfig.type !== 'array' || ctx.targetConfig.type !== 'array') {
        return {
          success: false,
          message: 'Both ports must be array type for item config transfer',
        }
      }

      const sourceArray = ctx.sourceConfig as ArrayPortConfig
      const targetArray = ctx.targetConfig as ArrayPortConfig

      // Only transfer if target has no item config or any item type
      if (targetArray.itemConfig && targetArray.itemConfig.type !== 'any') {
        return {
          success: false,
          message: 'Target array already has specific item configuration',
        }
      }

      // Transfer item configuration
      ctx.targetPort.setConfig({
        ...ctx.targetConfig,
        itemConfig: deepCopy(sourceArray.itemConfig),
      })

      // Update array items if needed
      ctx.targetNode.updateArrayItemConfig(ctx.targetPort)

      return {
        success: true,
        schemaTransferred: true,
        message: 'Array item configuration transferred successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: `Failed to transfer array item config: ${error}`,
      }
    }
  },

  /**
   * Set underlying type on AnyPort
   */
  setUnderlyingType: (ctx: TransferContext): TransferResult => {
    try {
      if (!(ctx.targetPort instanceof AnyPort)) {
        return {
          success: false,
          message: 'Target must be AnyPort to set underlying type',
        }
      }

      // Get source type (unwrap if it's also AnyPort)
      const sourceType = ctx.sourcePort instanceof AnyPort
        ? unwrapAnyPort(ctx.sourceConfig) || ctx.sourceConfig
        : ctx.sourceConfig

      // Set underlying type
      ctx.targetPort.setUnderlyingType(deepCopy(sourceType))

      // Refresh child ports if needed
      ctx.targetNode.refreshAnyPortUnderlyingPorts(ctx.targetPort, true)

      return {
        success: true,
        underlyingTypeSet: true,
        message: 'Underlying type set successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: `Failed to set underlying type: ${error}`,
      }
    }
  },

  // ============================================
  // Composite Strategies
  // ============================================

  /**
   * Compose multiple strategies sequentially
   */
  compose: (...strategies: TransferStrategy[]): TransferStrategy =>
    async (ctx) => {
      const result: TransferResult = {
        success: true,
        message: 'Composite transfer completed',
      }

      for (const strategy of strategies) {
        const strategyResult = await strategy(ctx)

        // Merge results
        result.schemaTransferred = result.schemaTransferred || strategyResult.schemaTransferred
        result.valueTransferred = result.valueTransferred || strategyResult.valueTransferred
        result.underlyingTypeSet = result.underlyingTypeSet || strategyResult.underlyingTypeSet

        // Stop on first failure
        if (!strategyResult.success) {
          return {
            ...result,
            success: false,
            error: strategyResult.error,
            message: strategyResult.message || 'Composite transfer failed',
          }
        }
      }

      return result
    },

  /**
   * Conditional strategy execution
   */
  when: (
    condition: (ctx: TransferContext) => boolean,
    thenStrategy: TransferStrategy,
    elseStrategy?: TransferStrategy,
  ): TransferStrategy =>
    (ctx) => {
      if (condition(ctx)) {
        return thenStrategy(ctx)
      }
      if (elseStrategy) {
        return elseStrategy(ctx)
      }
      return {
        success: true,
        message: 'Condition not met, no transfer performed',
      }
    },

  /**
   * Try multiple strategies until one succeeds
   */
  tryFirst: (...strategies: TransferStrategy[]): TransferStrategy =>
    async (ctx) => {
      for (const strategy of strategies) {
        const result = await strategy(ctx)
        if (result.success) {
          return result
        }
      }
      return {
        success: false,
        message: 'All strategies failed',
      }
    },

  // ============================================
  // Specialized Strategies
  // ============================================

  /**
   * Transfer both schema and value for objects
   */
  objectSchemaAndValue: (ctx: TransferContext): Promise<TransferResult> => {
    return Strategies.compose(
      Strategies.objectSchema,
      Strategies.value,
    )(ctx) as Promise<TransferResult>
  },

  /**
   * Transfer array configuration and value
   */
  arrayConfigAndValue: (ctx: TransferContext): Promise<TransferResult> => {
    return Strategies.compose(
      Strategies.arrayItemConfig,
      Strategies.value,
    )(ctx) as Promise<TransferResult>
  },

  /**
   * Set underlying type and transfer value
   */
  underlyingTypeAndValue: (ctx: TransferContext): Promise<TransferResult> => {
    return Strategies.compose(
      Strategies.setUnderlyingType,
      Strategies.value,
    )(ctx) as Promise<TransferResult>
  },

  /**
   * No-op strategy (do nothing)
   */
  noop: (): TransferResult => ({
    success: true,
    message: 'No transfer performed',
  }),
}

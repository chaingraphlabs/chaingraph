/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArrayPortConfig, ObjectPortConfig, StreamPortConfig } from '../base'
import type { TransferContext, TransferResult, TransferStrategy } from './types'
import { deepCopy } from '../../utils'
import { ArrayPort, ObjectPort } from '../instances'
import { AnyPort } from '../instances'
import { unwrapAnyPort } from './utils/port-resolver'
import { checkSchemaCompatibility } from './utils/schema-compatibility'

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
    // TODO: skip for now!
    return {
      success: true,
      valueTransferred: false, // Default to false, will be set to true if value actually changes
      message: 'Value transfer strategy called',
    }

    // try {
    //   const newValue = ctx.sourcePort.getValue() ?? ctx.sourceConfig.defaultValue ?? undefined
    //   const currentValue = ctx.targetPort.getValue()
    //
    //   // Check if value actually changed
    //   if (isDeepEqual(currentValue, newValue)) {
    //     return {
    //       success: true,
    //       valueTransferred: false,
    //       message: 'Value unchanged, skipping update',
    //     }
    //   }
    //
    //   ctx.targetPort.setValue(deepCopy(newValue))
    //   ctx.targetNode.updatePort(currentValue)
    //
    //   return {
    //     success: true,
    //     valueTransferred: true,
    //     message: 'Value transferred successfully',
    //   }
    // } catch (error) {
    //   return {
    //     success: false,
    //     error: error instanceof Error ? error : new Error(String(error)),
    //     message: `Failed to transfer value: ${error}`,
    //   }
    // }
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

      // Check if schemas are already equal
      // const sourceSchema = (sourceConfig as ObjectPortConfig).schema
      // const targetSchema = (targetObjectConfig as ObjectPortConfig).schema

      const result = checkSchemaCompatibility(sourceConfig, targetConfig, {
        allowMutableEmptySchema: false,
        allowExtraProperties: false,
        debug: false,
      })

      if (result.compatible) {
        return {
          success: true,
          schemaTransferred: false,
          message: 'Schema unchanged, skipping update',
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

  objectSchemaReset: (ctx: TransferContext): Promise<TransferResult> => {
    if (ctx.targetPort instanceof ObjectPort) {
      ctx.targetPort.setConfig({
        ...(ctx.targetConfig as ObjectPortConfig),
        schema: { properties: {} },
      })
      ctx.targetPort.setValue({}) // Reset value to empty object

      const childPorts = ctx.targetNode.getChildPorts(ctx.targetPort)
      if (childPorts.length) {
        ctx.targetNode.removePorts(childPorts.map(port => port.id))
      }

      ctx.targetNode.updatePort(ctx.targetPort)

      return Promise.resolve({
        success: true,
        schemaTransferred: true,
        message: 'Object schema reset successfully',
      })
    }

    if (ctx.targetPort instanceof AnyPort) {
      ctx.targetPort.setUnderlyingType(undefined)
      ctx.targetPort.setValue(undefined)
      ctx.targetNode.refreshAnyPortUnderlyingPorts(ctx.targetPort, true)

      return Promise.resolve({
        success: true,
        underlyingTypeSet: true,
        message: 'Underlying type reset successfully',
      })
    }

    return Promise.resolve({
      success: false,
      message: 'Target port must be ObjectPort or AnyPort to reset schema',
    })
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

      // Check if target can receive item config updates
      const canReceiveConfig = (
        // Target is mutable (can always update)
        targetArray.isSchemaMutable === true
        // Or target has no item config
        || !targetArray.itemConfig
        // Or target has any item type
        || targetArray.itemConfig.type === 'any'
      )

      if (!canReceiveConfig) {
        return {
          success: false,
          message: 'Target array cannot receive item configuration updates',
        }
      }

      const result = checkSchemaCompatibility(sourceArray, targetArray, {
        allowMutableEmptySchema: false,
        allowExtraProperties: false,
        debug: false,
      }).compatible
      && checkSchemaCompatibility(targetArray, sourceArray, {
        allowMutableEmptySchema: false,
        allowExtraProperties: false,
        debug: false,
      }).compatible

      // Check if item configs are already equal
      if (result) {
        return {
          success: true,
          schemaTransferred: false,
          message: 'Array item config unchanged, skipping update',
        }
      }

      // Transfer item configuration
      ctx.targetPort.setConfig({
        ...ctx.targetConfig,
        itemConfig: deepCopy(sourceArray.itemConfig),
      })

      // Note: updateArrayItemConfig removed - will be called by updateArrayItems strategy

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

  arraySchemaReset: (ctx: TransferContext): Promise<TransferResult> => {
    if (ctx.targetPort instanceof AnyPort) {
      ctx.targetPort.setUnderlyingType(undefined)
      ctx.targetPort.setValue(undefined)
      ctx.targetNode.refreshAnyPortUnderlyingPorts(ctx.targetPort, true)

      return Promise.resolve({
        success: true,
        underlyingTypeSet: true,
        message: 'Underlying type reset successfully',
      })
    }

    if (ctx.targetPort instanceof ArrayPort) {
      ctx.targetPort.setConfig({
        ...(ctx.targetConfig as ArrayPortConfig),
        itemConfig: { type: 'any' }, // Reset item config to Any
      })
      ctx.targetPort.setValue([]) // Reset value to empty object

      const childPorts = ctx.targetNode.getChildPorts(ctx.targetPort)
      if (childPorts.length) {
        ctx.targetNode.removePorts(childPorts.map(port => port.id))
      }

      ctx.targetNode.updatePort(ctx.targetPort)

      return Promise.resolve({
        success: true,
        schemaTransferred: true,
        message: 'Object schema reset successfully',
      })
    }

    return Promise.resolve({
      success: false,
      message: 'Target port must be ObjectPort or AnyPort to reset schema',
    })
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

      const result = checkSchemaCompatibility(sourceType, ctx.targetConfig, {
        allowMutableEmptySchema: false,
        allowExtraProperties: false,
        debug: false,
      }).compatible
      && checkSchemaCompatibility(ctx.targetConfig, sourceType, {
        allowMutableEmptySchema: false,
        allowExtraProperties: false,
        debug: false,
      }).compatible

      if (result) {
        return {
          success: true,
          message: `Source type is compatible with target port, no need to set underlying type`,
        }
      }

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

  resetUnderlyingType: (ctx: TransferContext): TransferResult => {
    console.log(`[Strategies.resetUnderlyingType] Resetting underlying type for port ${ctx.targetPort}`)

    if (!(ctx.targetPort instanceof AnyPort)) {
      return {
        success: false,
        message: 'Target must be AnyPort to set underlying type',
      }
    }

    ctx.targetPort.setUnderlyingType(undefined)
    ctx.targetPort.setValue(undefined)

    // Refresh child ports if needed
    ctx.targetNode.refreshAnyPortUnderlyingPorts(ctx.targetPort, true)

    return {
      success: true,
      underlyingTypeSet: true,
      message: 'Underlying type set successfully',
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
      // Strategies.value,
    )(ctx) as Promise<TransferResult>
  },

  /**
   * Update array items after configuration or value changes
   */
  updateArrayItems: (ctx: TransferContext): TransferResult => {
    try {
      if (ctx.targetConfig.type === 'array') {
        ctx.targetNode.updateArrayItemConfig(ctx.targetPort)
      }
      return {
        success: true,
        message: 'Array items updated',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: `Failed to update array items: ${error}`,
      }
    }
  },

  /**
   * Transfer array configuration and value
   */
  arrayConfigAndValue: (ctx: TransferContext): Promise<TransferResult> => {
    return Strategies.compose(
      Strategies.arrayItemConfig,
      // Strategies.value,
      Strategies.updateArrayItems, // Update items once after all changes
    )(ctx) as Promise<TransferResult>
  },

  /**
   * Transfer stream item configuration
   */
  streamItemConfig: (ctx: TransferContext): TransferResult => {
    try {
      if (ctx.sourceConfig.type !== 'stream' || ctx.targetConfig.type !== 'stream') {
        return {
          success: false,
          message: 'Both ports must be stream type for item config transfer',
        }
      }

      const sourceStream = ctx.sourceConfig as StreamPortConfig
      const targetStream = ctx.targetConfig as StreamPortConfig

      // Check if target can receive item config updates
      const canReceiveConfig = (
        // Target is mutable (can always update)
        targetStream.isSchemaMutable === true
        // Or target has no item config
        || !targetStream.itemConfig
        // Or target has any item type
        || targetStream.itemConfig.type === 'any'
      )

      if (!canReceiveConfig) {
        return {
          success: false,
          message: 'Target stream cannot receive item configuration updates',
        }
      }

      const result = checkSchemaCompatibility(sourceStream, targetStream, {
        allowMutableEmptySchema: false,
        allowExtraProperties: false,
        debug: false,
      })

      // Check if item configs are already equal
      if (result.compatible) {
        return {
          success: true,
          schemaTransferred: false,
          message: 'Stream item config unchanged, skipping update',
        }
      }

      // Transfer item configuration
      ctx.targetPort.setConfig({
        ...ctx.targetConfig,
        itemConfig: deepCopy(sourceStream.itemConfig),
      })

      // Note: updateStreamItemConfig removed - will be called by updateStreamItems strategy

      return {
        success: true,
        schemaTransferred: true,
        message: 'Stream item configuration transferred successfully',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        message: `Failed to transfer stream item config: ${error}`,
      }
    }
  },

  /**
   * Transfer stream configuration and value
   */
  streamConfigAndValue: (ctx: TransferContext): Promise<TransferResult> => {
    return Strategies.compose(
      Strategies.streamItemConfig,
      // Strategies.value,
      // Strategies.updateStreamItems, // Update items once after all changes
    )(ctx) as Promise<TransferResult>
  },

  /**
   * Set underlying type and transfer value
   */
  underlyingTypeAndValue: (ctx: TransferContext): Promise<TransferResult> => {
    return Strategies.compose(
      Strategies.setUnderlyingType,
      // Strategies.value,
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

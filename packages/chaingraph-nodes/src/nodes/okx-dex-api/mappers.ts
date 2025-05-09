/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ChainData as ChainDataAPI,
  ComparisonQuote as ComparisonQuoteAPI,
  DexProtocol as DexProtocolAPI,
  DexRouter as DexRouterAPI,
  QuoteData as QuoteDataAPI,
  RouterResult as RouterResultAPI,
  SubRouterInfo as SubRouterInfoAPI,
  TokenInfo as TokenInfoAPI,
  TokenListResponse as TokenListResponseAPI,
  TransactionData as TransactionDataAPI,
} from '@okx-dex/okx-dex-sdk'

import {
  ChainData,
  ComparisonQuote,
  DexProtocol,
  DexRouter,
  QuoteData,
  RouterResult,
  SubRouterInfo,
  SwapExecutionData,
  SwapResponseData,
  TokenInfo,
  TokenListResponse,
  TransactionData,
} from './types'

/**
 * Base mapper utility function that creates a new instance of a class
 * and copies properties from the source object
 */
export function mapToInstance<T>(source: any, Constructor: new () => T): T {
  if (!source)
    return null as unknown as T

  const instance = new Constructor()

  // Copy all properties from source to instance
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      instance[key] = source[key]
    }
  }

  return instance
}

/**
 * Maps an array of items using the provided mapper function
 */
export function mapArray<S, T>(
  sourceArray: S[] | undefined,
  mapperFn: (item: S) => T,
): T[] {
  if (!sourceArray || !Array.isArray(sourceArray))
    return []
  return sourceArray.map(mapperFn)
}

/**
 * Specific mappers for each type
 */
export function mapTokenInfo(source: TokenInfoAPI | undefined): TokenInfo {
  return mapToInstance(source, TokenInfo)
}

export function mapTokenListResponse(source: TokenListResponseAPI | undefined): TokenListResponse {
  return mapToInstance(source, TokenListResponse)
}

export function mapDexProtocol(source: DexProtocolAPI | undefined): DexProtocol {
  return mapToInstance(source, DexProtocol)
}

export function mapSubRouterInfo(source: SubRouterInfoAPI | undefined): SubRouterInfo {
  if (!source)
    return null as unknown as SubRouterInfo

  const instance = new SubRouterInfo()

  // Map primitive properties directly
  instance.dexProtocol = mapArray(source.dexProtocol, mapDexProtocol)
  instance.fromToken = mapTokenInfo(source.fromToken)
  instance.toToken = mapTokenInfo(source.toToken)

  return instance
}

export function mapDexRouter(source: DexRouterAPI | undefined): DexRouter {
  if (!source)
    return null as unknown as DexRouter

  const instance = new DexRouter()

  // Map primitive properties
  instance.router = source.router
  instance.routerPercent = source.routerPercent

  // Map nested array with specific mapper
  instance.subRouterList = mapArray(source.subRouterList, mapSubRouterInfo)

  return instance
}

export function mapComparisonQuote(source: ComparisonQuoteAPI | undefined): ComparisonQuote {
  return mapToInstance(source, ComparisonQuote)
}

export function mapTransactionData(source: TransactionDataAPI | undefined): TransactionData | undefined {
  if (!source)
    return undefined
  return mapToInstance(source, TransactionData)
}

export function mapRouterResult(source: RouterResultAPI | undefined): RouterResult | undefined {
  if (!source)
    return undefined

  const instance = new RouterResult()

  // Map primitive properties
  instance.chainId = source.chainId
  instance.estimateGasFee = source.estimateGasFee
  instance.fromTokenAmount = source.fromTokenAmount
  instance.toTokenAmount = source.toTokenAmount
  instance.priceImpactPercentage = source.priceImpactPercentage
  instance.tradeFee = source.tradeFee

  // Map complex nested properties
  instance.fromToken = mapTokenInfo(source.fromToken)
  instance.toToken = mapTokenInfo(source.toToken)
  instance.dexRouterList = mapArray(source.dexRouterList, mapDexRouter)
  instance.quoteCompareList = mapArray(source.quoteCompareList, mapComparisonQuote)

  return instance
}

export function mapQuoteData(source: QuoteDataAPI | undefined): QuoteData {
  if (!source)
    return null as unknown as QuoteData

  const instance = new QuoteData()

  // Map primitive properties
  instance.chainId = source.chainId
  instance.estimateGasFee = source.estimateGasFee
  instance.fromTokenAmount = source.fromTokenAmount
  instance.toTokenAmount = source.toTokenAmount
  instance.priceImpactPercentage = source.priceImpactPercentage
  instance.tradeFee = source.tradeFee

  // Map complex nested properties
  instance.fromToken = mapTokenInfo(source.fromToken)
  instance.toToken = mapTokenInfo(source.toToken)
  instance.dexRouterList = mapArray(source.dexRouterList, mapDexRouter)
  instance.quoteCompareList = mapArray(source.quoteCompareList, mapComparisonQuote)
  instance.routerResult = mapRouterResult(source.routerResult)
  instance.tx = mapTransactionData(source.tx)

  return instance
}

export function mapChainData(source: ChainDataAPI | undefined): ChainData {
  return mapToInstance(source, ChainData)
}

/**
 * Maps SwapResponseData from API response to ChainGraph type
 */
export function mapSwapResponseData(source: any): SwapResponseData {
  if (!source)
    return new SwapResponseData()

  const instance = new SwapResponseData()

  // Map basic properties
  instance.code = source.code || ''
  instance.msg = source.msg || ''

  // Map data array if it exists
  if (source.data && Array.isArray(source.data)) {
    instance.data = source.data.map((item) => {
      const execData = new SwapExecutionData()

      if (item.routerResult) {
        execData.routerResult = mapRouterResult(item.routerResult)!
      }

      if (item.tx) {
        execData.tx = mapTransactionData(item.tx)
      }

      return execData
    })
  } else {
    instance.data = []
  }

  return instance
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../../../node/interface'

import type { ArrayPortConfig, IPort } from '../../base'
import { describe, expect, it, vi } from 'vitest'
import { AnyPort, ArrayPort } from '../../instances'
import { createDefaultTransferEngine } from '../index'

function createNodeStub(): INode {
  return {
    updateArrayItemConfig: vi.fn(),
    getChildPorts: vi.fn().mockReturnValue([]),
    removePorts: vi.fn(),
    updatePort: vi.fn(),
    refreshAnyPortUnderlyingPorts: vi.fn(),
    getPort: vi.fn().mockReturnValue(undefined),
    updatePorts: vi.fn(),
    copyObjectSchemaTo: vi.fn(),
  } as unknown as INode
}

describe('array transfer rules', () => {
  it('transfers item config from any-wrapped array to array accepting any items on connect', async () => {
    const engine = createDefaultTransferEngine()
    const source = new AnyPort({
      type: 'any',
      underlyingType: {
        type: 'array',
        itemConfig: { type: 'string' },
      },
    })
    const target = new ArrayPort({
      type: 'array',
      itemConfig: { type: 'any' },
      isSchemaMutable: true,
    })
    const node = createNodeStub()

    expect(engine.canConnect(source as IPort, target as IPort)).toBe(true)

    const result = await engine.onConnect(source as IPort, target as IPort, node, node)
    expect(result.success).toBe(true)

    const targetConfig = target.getConfig() as ArrayPortConfig
    expect(targetConfig.itemConfig?.type).toBe('string')
  })

  it('updates item config on source updates when source is any-wrapped array', async () => {
    const engine = createDefaultTransferEngine()
    const source = new AnyPort({
      type: 'any',
      underlyingType: {
        type: 'array',
        itemConfig: { type: 'string' },
      },
    })
    const target = new ArrayPort({
      type: 'array',
      itemConfig: { type: 'any' },
      isSchemaMutable: true,
    })
    const node = createNodeStub()

    expect((target.getConfig() as ArrayPortConfig).isSchemaMutable).toBe(true)
    await engine.onConnect(source as IPort, target as IPort, node, node)
    const afterConnectConfig = target.getConfig() as ArrayPortConfig
    expect(afterConnectConfig.isSchemaMutable).toBe(true)
    expect((target.getConfig() as ArrayPortConfig).itemConfig?.type).toBe('string')

    source.setUnderlyingType({
      type: 'array',
      itemConfig: { type: 'number' },
    } as ArrayPortConfig)

    const updateResult = await engine.onSourceUpdate(source as IPort, target as IPort, node, node)
    expect(updateResult.success).toBe(true)

    const targetConfig = target.getConfig() as ArrayPortConfig
    expect(targetConfig.itemConfig?.type).toBe('number')
  })

  it('rejects incompatible any-wrapped array when target has concrete item type', () => {
    const engine = createDefaultTransferEngine()
    const source = new AnyPort({
      type: 'any',
      underlyingType: {
        type: 'array',
        itemConfig: { type: 'string' },
      },
    })
    const target = new ArrayPort({
      type: 'array',
      itemConfig: { type: 'number' },
    })

    expect(engine.canConnect(source as IPort, target as IPort)).toBe(false)
  })

  it('propagates underlying array type into an any target', async () => {
    const engine = createDefaultTransferEngine()
    const source = new AnyPort({
      type: 'any',
      underlyingType: {
        type: 'array',
        itemConfig: { type: 'string' },
      },
    })
    const target = new AnyPort({ type: 'any' })
    const node = createNodeStub()

    const result = await engine.onConnect(source as IPort, target as IPort, node, node)
    expect(result.success).toBe(true)

    const targetConfig = target.getRawConfig()
    const underlying = targetConfig.underlyingType as ArrayPortConfig
    expect(underlying?.type).toBe('array')
    expect(underlying?.itemConfig?.type).toBe('string')
  })

  it('rejects any-wrapped array without item config when target item type is concrete', () => {
    const engine = createDefaultTransferEngine()
    const source = new AnyPort({
      type: 'any',
      underlyingType: {
        type: 'array',
        itemConfig: undefined as unknown as ArrayPortConfig,
      },
    })
    const target = new ArrayPort({
      type: 'array',
      itemConfig: { type: 'string' },
    })

    expect(engine.canConnect(source as IPort, target as IPort)).toBe(false)
  })
})

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ExecutionContext, NodeExecutionStatus } from '@badaitech/chaingraph-types'
import { describe, expect, it } from 'vitest'

import TextSearchNode from '../text-search.node'

function getTestContext() {
  const abortController = new AbortController()
  return new ExecutionContext('test', abortController)
}

describe('search text node', () => {
  it('should return true if a given string is in the text', async () => {
    const node = new TextSearchNode('search-text-node')

    // Set inputs
    node.sourceText = 'Hello, World!'
    node.searchText = ', W'

    // Execute
    const result = await node.execute(getTestContext())

    expect(result.status).toBe(NodeExecutionStatus.Completed)
    expect(result.outputs?.get('result')).toBe(true)
  })

  it('should return true if a given lowercase string is in the text with a different case', async () => {
    const node = new TextSearchNode('search-text-node')

    // Set inputs
    node.sourceText = 'I AM UPPERCASE'
    node.searchText = 'case'

    // Execute
    const result = await node.execute(getTestContext())

    expect(result.status).toBe(NodeExecutionStatus.Completed)
    expect(result.outputs?.get('result')).toBe(true)
  })

  it('should return false if the search string is not found in the text', async () => {
    const node = new TextSearchNode('search-text-node')

    // Set inputs
    node.sourceText = 'Hello, World!'
    node.searchText = 'computer'

    // Execute
    const result = await node.execute(getTestContext())

    expect(result.status).toBe(NodeExecutionStatus.Completed)
    expect(result.outputs?.get('result')).toBe(false)
  })

  it('should return true if the search string is empty', async () => {
    const node = new TextSearchNode('search-text-node')

    // Set inputs
    node.sourceText = 'Hello, World!'
    node.searchText = ''

    // Execute
    const result = await node.execute(getTestContext())

    expect(result.status).toBe(NodeExecutionStatus.Completed)
    expect(result.outputs?.get('result')).toBe(true)
  })

  it('should return false if the source string is empty', async () => {
    const node = new TextSearchNode('search-text-node')

    // Set inputs
    node.sourceText = ''
    node.searchText = 'nope'

    // Execute
    const result = await node.execute(getTestContext())

    expect(result.status).toBe(NodeExecutionStatus.Completed)
    expect(result.outputs?.get('result')).toBe(false)
  })
})

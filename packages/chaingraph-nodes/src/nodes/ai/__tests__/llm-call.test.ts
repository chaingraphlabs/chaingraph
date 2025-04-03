/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ExecutionContext } from '@badaitech/chaingraph-types'
import { describe, expect, it } from 'vitest'
import LLMCallNode, { LLMModels } from '../llm-call.node'

describe('deep seek LLM Call', () => {
  it('should resolve the inner schema correctly', async () => {
    const llmNode = new LLMCallNode()
    llmNode.model = LLMModels.DeepseekChat
    llmNode.prompt = 'Say only `test` and dont say anything else.'
    llmNode.temperature = 0
    llmNode.apiKey = process.env.DEEPSEEK_API_KEY
    if (!process.env.DEEPSEEK_API_KEY) {
      return
    }
    const abortController = new AbortController()
    const context = new ExecutionContext('', abortController)
    const result = await llmNode.execute(context)
    await result.backgroundActions[0]()
    console.log(result)
    const resultLlmNode: string = llmNode.outputStream.getBuffer()
    expect(resultLlmNode).toStrictEqual(['test'])
  }, 100000)
})

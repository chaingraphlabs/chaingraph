/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ExecutionContext, ExecutionEngine, Flow } from '@badaitech/chaingraph-types'
import { describe, expect, it } from 'vitest'
import { DirectSecretDeepSeek } from '../../secret'
import LLMCallNode, { LLMModels } from '../llm-call.node'

describe('deep seek LLM Call', () => {
  it('should resolve the inner schema correctly', async (ctx) => {
    const deepseekAPIkey = process.env.DEEPSEEK_API_KEY
    ctx.skip(!deepseekAPIkey, 'Skipping test because DEEPSEEK_API_KEY is not set')

    const flow = new Flow({ id: 'test-flow' })

    const directSecretNode = new DirectSecretDeepSeek('direct-secret-deepseek-node')
    directSecretNode.initialize()

    directSecretNode.deepSeekAPIKey = deepseekAPIkey

    const llmNode = new LLMCallNode('llm-call-node')
    llmNode.initialize()

    llmNode.model = LLMModels.DeepseekChat
    llmNode.prompt = 'Say only `test` and dont say anything else.'
    llmNode.temperature = 0

    flow.addNode(directSecretNode)
    flow.addNode(llmNode)

    await flow.connectPorts(
      directSecretNode.id,
      directSecretNode.findPortByPath(['secret'])!.id,
      llmNode.id,
      llmNode.findPortByPath(['apiKey'])!.id,
    )

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context)

    await executionEngine.execute()

    const result = await llmNode.execute(context)
    await result.backgroundActions![0]()
    console.log(result)

    const resultLlmNode: string[] = llmNode.outputStream.getBuffer()
    expect(resultLlmNode).toStrictEqual(['test'])
  }, 100000)
})

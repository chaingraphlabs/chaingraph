/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Number,
  ObjectSchema,
  Output,
  PortEnumFromObject,
  String,
} from '@badaitech/chaingraph-types'
import { Decimal } from 'decimal.js'
import { OpenAI } from 'openai'
import { NODE_CATEGORIES } from '../../categories'

export enum OGLLMModels {
  LLama = 'llama-3.3-70b-instruct',
  DeepSeek = 'deepseek-r1-70b',
}

export enum OGLLMModelsProviderAddress {
  LLama = '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
  DeepSeek = '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3',
}

interface LedgerDetailStructOutput {
  ledgerInfo: bigint[]
  infers: [string, bigint, bigint][]
  fines: [string, bigint, bigint][] | null
}

@ObjectSchema({
  description: '0G LLM Model',
  category: 'LLM',
})
class OGLLMModel {
  @String({
    title: 'Model',
    description: 'Language Model',
  })
  public model: OGLLMModels = OGLLMModels.LLama

  @String({
    title: 'Model',
    description: 'Language Model',
  })
  public providerAddress: OGLLMModelsProviderAddress = OGLLMModelsProviderAddress.LLama

  @Number({
    title: 'Temperature',
    description: 'Temperature for sampling',
  })
  public temperature: number = 0

  constructor(model: OGLLMModels, providerAddress: OGLLMModelsProviderAddress, temperature: number) {
    this.model = model
    this.temperature = temperature
    this.providerAddress = providerAddress
  }
}

const llmModels = {
  [OGLLMModels.LLama]: new OGLLMModel(OGLLMModels.LLama, OGLLMModelsProviderAddress.LLama, 0),
  [OGLLMModels.DeepSeek]: new OGLLMModel(OGLLMModels.DeepSeek, OGLLMModelsProviderAddress.DeepSeek, 0),
}

@Node({
  title: '0G LLM Call',
  description: 'Sends prompt to Language Model on 0G network and streams response',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'prompt', 'gpt', '0g'],
})
class OGLLMCallNode extends BaseNode {
  @Input()
  @PortEnumFromObject(llmModels, {
    title: 'Model',
    description: 'Language Model',
  })
  model: keyof typeof llmModels = OGLLMModels.LLama

  @Input()
  @String({
    title: 'Private Key',
    description: '0G private key',
    ui: {
      isPassword: true,
    },
  })
  privateKey: string = ''

  @Input()
  @String({
    title: 'Prompt',
    description: 'Input prompt for the language model',
    ui: {
      isTextArea: true,
    },
  })
  prompt: string = ''

  @Input()
  @Number({
    title: 'Fee',
    description: 'Default fee to reward node owner',
  })
  fee: number = 0.000000000000003

  @Input()
  @Number({
    title: 'Min Balance',
    description: 'Minimum balance to use in inference ledger',
  })
  minBalance: number = 1

  @Input()
  @Number({
    title: 'Temperature',
    description: 'Temperature for sampling',
    min: 0,
    max: 1,
    step: 0.01,
    ui: {
      isSlider: true,
      leftSliderLabel: 'More deterministic',
      rightSliderLabel: 'More creative',
    },
  })
  temperature: number = 0

  @Output()
  @String({
    title: 'LLM answer',
    description: 'Output of LLM',
    ui: {
      isTextArea: true,
    },
  })
  output: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // eslint-disable-next-line ts/no-require-imports
    const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker')
    // eslint-disable-next-line ts/no-require-imports
    const { ethers } = require('ethers')

    if (!this.privateKey) {
      throw new Error('API Key is required')
    }
    const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai')
    const wallet = new ethers.Wallet(this.privateKey, provider)

    const broker = await createZGComputeNetworkBroker(wallet)
    // const services = await broker.inference.listService()

    let accountDetails: LedgerDetailStructOutput | undefined

    try {
      accountDetails = await broker.ledger.getLedger()
    } catch (error) {
      await broker.ledger.addLedger(this.minBalance)
      accountDetails = await broker.ledger.getLedger()
    }

    if (!accountDetails) {
      throw new Error('Failed to retrieve ledger details')
    }

    const balanceDec = new Decimal(accountDetails.ledgerInfo[0].toString()).mul(
      new Decimal(10).pow(-18),
    )

    if (balanceDec.lessThan(this.minBalance)) {
      const topUpAmount = new Decimal(this.minBalance).sub(balanceDec).toNumber()
      console.log(
        `[0G] Insufficient balance: ${balanceDec.toString()} < ${this.minBalance}, adding ${topUpAmount} 0G to ledger`,
      )
      await broker.ledger.depositFund(
        topUpAmount,
      )
    }

    const llmModel = llmModels[this.model]
    if (!llmModel) {
      throw new Error(`Invalid model: ${this.model}`)
    }

    await broker.inference.settleFee(llmModel.providerAddress, this.fee)
    const { endpoint, model } = await broker.inference.getServiceMetadata(
      llmModel.providerAddress,
    )

    const headers = await broker.inference.getRequestHeaders(
      llmModel.providerAddress,
      this.prompt,
    )

    const openai = new OpenAI({
      baseURL: endpoint,
      apiKey: '',
    })

    const completion = await openai.chat.completions.create(
      {
        messages: [{ role: 'system', content: this.prompt }],
        model,
      },
      {
        headers: {
          ...headers,
        },
      },
    )

    this.output = completion.choices[0].message.content ?? ''
    return {}
  }
}

export default OGLLMCallNode

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  EncryptedSecretValue,
  ExecutionContext,
  NodeExecutionResult,
  SecretType,
  SecretTypeMap,
} from '@badaitech/chaingraph-types'
import { Buffer } from 'node:buffer'
import { subtle } from 'node:crypto'
import {
  BaseNode,
  Input,
  Node,
  Output,
  Secret,
  String,
  wrapSecret,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

async function encryptDirectSecret<T extends SecretType>(
  ctx: ExecutionContext,
  secretType: T,
  value: SecretTypeMap[T],
): Promise<EncryptedSecretValue<T>> {
  const keyPair = await ctx.getECDHKeyPair()

  const remoteKeyPair = await subtle.generateKey({
    name: 'ECDH',
    namedCurve: 'P-256',
  }, false, ['deriveKey'])
  const remotePublicKey = await subtle.exportKey('raw', remoteKeyPair.publicKey)

  const encryptionKey = await subtle.deriveKey({
    name: 'ECDH',
    public: keyPair.publicKey,
  }, remoteKeyPair.privateKey, {
    name: 'AES-GCM',
    length: 256,
  }, false, ['encrypt'])

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(JSON.stringify(value))

  const encrypted = await subtle.encrypt({
    name: 'AES-GCM',
    length: 256,
    iv,
  }, encryptionKey, data)

  return wrapSecret(secretType, {
    encrypted: Buffer.concat([iv, Buffer.from(encrypted)]).toString('base64'),
    publicKey: Buffer.from(remotePublicKey).toString('base64'),
  })
}

@Node({
  title: 'Direct Secret OpenAI',
  description: 'Converts OpenAI API key directly into an encrypted secret. Unlike the Secret node, this takes raw text rather than a reference ID. Use this when you need to immediately encrypt your OpenAI API key without storing it in the secret management panel first.',
  category: NODE_CATEGORIES.SECRET,
  tags: ['secret', 'encryption', 'security', 'api-keys', 'passwords', 'sensitive-data'],
})
export class DirectSecretOpenAI extends BaseNode {
  @Input()
  @String({
    title: 'OpenAI API Key',
    description: 'Your raw OpenAI API key that needs to be encrypted. This will be converted into a secure format that can be safely used throughout your workflow.',
    ui: {
      isPassword: true,
    },
  })
  openAIAPIKey?: SecretTypeMap['openai']

  @Output()
  @Secret<'openai'>({
    title: 'Encrypted OpenAI API Key',
    description: 'The OpenAI API key encrypted as a secure secret that can be safely passed between nodes. This encrypted format protects your OpenAI credentials while allowing them to be used by compatible nodes in your workflow.',
    secretType: 'openai',
  })
  encryptedOpenAIKey?: EncryptedSecretValue<'openai'>

  async execute(ctx: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.openAIAPIKey) {
      throw new Error(`OpenAI APi key is required`)
    }

    this.encryptedOpenAIKey = await encryptDirectSecret(ctx, 'openai', this.openAIAPIKey)

    return {}
  }
}

@Node({
  title: 'Direct Secret 0G',
  description: 'Converts 0G private key directly into an encrypted secret. Unlike the Secret node, this takes raw text rather than a reference ID. Use this when you need to immediately encrypt your 0G private key without storing it in the secret management panel first.',
  category: NODE_CATEGORIES.SECRET,
  tags: ['secret', 'encryption', 'security', 'api-keys', 'passwords', 'sensitive-data'],
})
export class DirectSecret0G extends BaseNode {
  @Input()
  @String({
    title: '0G Private Key',
    description: 'Your raw 0G network private key used for authentication and transactions. This will be converted into a secure format that can be safely used throughout your workflow.',
    ui: {
      isPassword: true,
    },
  })
  '0GPrivateKey'?: SecretTypeMap['0g']

  @Output()
  @Secret<'0g'>({
    title: 'Encrypted 0G Private Key',
    description: 'The 0G private key encrypted as a secure secret that can be safely passed between nodes. This encrypted format protects your 0G credentials while allowing them to be used by compatible nodes in your workflow.',
    secretType: '0g',
  })
  encrypted0GPrivateKey?: EncryptedSecretValue<'0g'>

  async execute(ctx: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this['0GPrivateKey']) {
      throw new Error(`0G Private Key is required`)
    }

    this.encrypted0GPrivateKey = await encryptDirectSecret(ctx, '0g', this['0GPrivateKey'])

    return {}
  }
}

@Node({
  title: 'Direct Secret Anthropic',
  description: 'Converts Anthropic API key directly into an encrypted secret. Unlike the Secret node, this takes raw text rather than a reference ID. Use this when you need to immediately encrypt your Anthropic API key without storing it in the secret management panel first.',
  category: NODE_CATEGORIES.SECRET,
  tags: ['secret', 'encryption', 'security', 'api-keys', 'passwords', 'sensitive-data'],
})
export class DirectSecretAnthropic extends BaseNode {
  @Input()
  @String({
    title: 'Anthropic API Key',
    description: 'Your raw Anthropic API key that needs to be encrypted. This will be converted into a secure format that can be safely used throughout your workflow.',
    ui: {
      isPassword: true,
    },
  })
  anthropicAPIKey?: SecretTypeMap['anthropic']

  @Output()
  @Secret<'anthropic'>({
    title: 'Encrypted Anthropic API Key',
    description: 'The Anthropic API key encrypted as a secure secret that can be safely passed between nodes. This encrypted format protects your Anthropic credentials while allowing them to be used by compatible nodes in your workflow.',
    secretType: 'anthropic',
  })
  encryptedAnthropicKey?: EncryptedSecretValue<'anthropic'>

  async execute(ctx: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.anthropicAPIKey) {
      throw new Error(`Anthropic API key is required`)
    }

    this.encryptedAnthropicKey = await encryptDirectSecret(ctx, 'anthropic', this.anthropicAPIKey)

    return {}
  }
}

@Node({
  title: 'Direct Secret DeepSeek',
  description: 'Converts DeepSeek API key directly into an encrypted secret. Unlike the Secret node, this takes raw text rather than a reference ID. Use this when you need to immediately encrypt your DeepSeek API key without storing it in the secret management panel first.',
  category: NODE_CATEGORIES.SECRET,
  tags: ['secret', 'encryption', 'security', 'api-keys', 'passwords', 'sensitive-data'],
})
export class DirectSecretDeepSeek extends BaseNode {
  @Input()
  @String({
    title: 'DeepSeek API Key',
    description: 'Your raw DeepSeek API key that needs to be encrypted. This will be converted into a secure format that can be safely used throughout your workflow.',
    ui: {
      isPassword: true,
    },
  })
  deepSeekAPIKey?: SecretTypeMap['deepseek']

  @Output()
  @Secret<'deepseek'>({
    title: 'Encrypted DeepSeek API Key',
    description: 'The DeepSeek API key encrypted as a secure secret that can be safely passed between nodes. This encrypted format protects your DeepSeek credentials while allowing them to be used by compatible nodes in your workflow.',
    secretType: 'deepseek',
  })
  encryptedDeepSeekKey?: EncryptedSecretValue<'deepseek'>

  async execute(ctx: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.deepSeekAPIKey) {
      throw new Error(`DeepSeek API key is required`)
    }

    this.encryptedDeepSeekKey = await encryptDirectSecret(ctx, 'deepseek', this.deepSeekAPIKey)

    return {}
  }
}

@Node({
  title: 'Direct Secret CoinMarketCap',
  description: 'Converts CoinMarketCap API key directly into an encrypted secret. Unlike the Secret node, this takes raw text rather than a reference ID. Use this when you need to immediately encrypt your CoinMarketCap API key without storing it in the secret management panel first.',
  category: NODE_CATEGORIES.SECRET,
  tags: ['secret', 'encryption', 'security', 'api-keys', 'passwords', 'sensitive-data'],
})
export class DirectSecretCoinMarketCap extends BaseNode {
  @Input()
  @String({
    title: 'CoinMarketCap API Key',
    description: 'Your raw CoinMarketCap API key that needs to be encrypted. This will be converted into a secure format that can be safely used throughout your workflow.',
    ui: {
      isPassword: true,
    },
  })
  coinMarketCapAPIKey?: SecretTypeMap['coinmarketcap']

  @Output()
  @Secret<'coinmarketcap'>({
    title: 'Encrypted CoinMarketCap API Key',
    description: 'The CoinMarketCap API key encrypted as a secure secret that can be safely passed between nodes. This encrypted format protects your CoinMarketCap credentials while allowing them to be used by compatible nodes in your workflow.',
    secretType: 'coinmarketcap',
  })
  encryptedCoinMarketCapKey?: EncryptedSecretValue<'coinmarketcap'>

  async execute(ctx: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.coinMarketCapAPIKey) {
      throw new Error(`CoinMarketCap API key is required`)
    }

    this.encryptedCoinMarketCapKey = await encryptDirectSecret(ctx, 'coinmarketcap', this.coinMarketCapAPIKey)

    return {}
  }
}

@Node({
  title: 'Direct Secret',
  description: 'Converts generic string secret (such as API keys or passwords) directly into an encrypted secret. Unlike the Secret node, this takes raw text rather than a reference ID. Use this when you need to immediately encrypt sensitive string information without storing it in the secret management panel first.',
  category: NODE_CATEGORIES.SECRET,
  tags: ['secret', 'encryption', 'security', 'api-keys', 'passwords', 'sensitive-data'],
})
export class DirectSecret extends BaseNode {
  @Input()
  @String({
    title: 'Secret String',
    description: 'Your raw string secret (such as an API key or password) that needs to be encrypted. This will be converted into a secure format that can be safely used throughout your workflow.',
    ui: {
      isPassword: true,
    },
  })
  stringSecret?: SecretTypeMap['string']

  @Output()
  @Secret<'string'>({
    title: 'Encrypted String Secret',
    description: 'The generic string secret encrypted as a secure secret that can be safely passed between nodes. This encrypted format protects your sensitive string information while allowing it to be used by compatible nodes in your workflow.',
    secretType: 'string',
  })
  encryptedStringSecret?: EncryptedSecretValue<'string'>

  async execute(ctx: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.stringSecret) {
      throw new Error(`Secret String is required`)
    }

    this.encryptedStringSecret = await encryptDirectSecret(ctx, 'string', this.stringSecret)

    return {}
  }
}

@Node({
  title: 'Direct Secret XAPI',
  description: 'Converts XAPI credentials (key and secretKey) directly into an encrypted secret. Unlike the Secret node, this takes raw text rather than a reference ID. Use this when you need to immediately encrypt your XAPI credentials without storing them in the secret management panel first.',
  category: NODE_CATEGORIES.SECRET,
  tags: ['secret', 'encryption', 'security', 'api-keys', 'passwords', 'sensitive-data'],
})
export class DirectSecretXAPI extends BaseNode {
  @Input()
  @String({
    title: 'XAPI Key',
    description: 'The key portion of your XAPI credentials that needs to be encrypted. This will be combined with the secret key and converted into a secure format.',
    ui: {
      isPassword: true,
    },
  })
  key?: SecretTypeMap['xAPI']['key']

  @Input()
  @String({
    title: 'XAPI Secret Key',
    description: 'The secret key portion of your XAPI credentials that needs to be encrypted. This will be combined with the key and converted into a secure format.',
    ui: {
      isPassword: true,
    },
  })
  secretKey?: SecretTypeMap['xAPI']['secretKey']

  @Output()
  @Secret<'xAPI'>({
    title: 'Encrypted XAPI Credentials',
    description: 'The XAPI credentials (key and secretKey) encrypted as a secure secret that can be safely passed between nodes. This encrypted format protects your XAPI credentials while allowing them to be used by compatible nodes in your workflow.',
    secretType: 'xAPI',
  })
  encryptedXAPICredentials?: EncryptedSecretValue<'xAPI'>

  async execute(ctx: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.key) {
      throw new Error(`XAPI Key is required`)
    }

    if (!this.secretKey) {
      throw new Error(`XAPI Secret Key is required`)
    }

    this.encryptedXAPICredentials = await encryptDirectSecret(ctx, 'xAPI', {
      key: this.key,
      secretKey: this.secretKey,
    })

    return {}
  }
}

@Node({
  title: 'Direct Secret XAPP',
  description: 'Converts XAPP credentials (key and secretKey) directly into an encrypted secret. Unlike the Secret node, this takes raw text rather than a reference ID. Use this when you need to immediately encrypt your XAPP credentials without storing them in the secret management panel first.',
  category: NODE_CATEGORIES.SECRET,
  tags: ['secret', 'encryption', 'security', 'api-keys', 'passwords', 'sensitive-data'],
})
export class DirectSecretXAPP extends BaseNode {
  @Input()
  @String({
    title: 'XAPP Key',
    description: 'The key portion of your XAPP credentials that needs to be encrypted. This will be combined with the secret key and converted into a secure format.',
    ui: {
      isPassword: true,
    },
  })
  key?: SecretTypeMap['xApp']['key']

  @Input()
  @String({
    title: 'XAPP Secret Key',
    description: 'The secret key portion of your XAPP credentials that needs to be encrypted. This will be combined with the key and converted into a secure format.',
    ui: {
      isPassword: true,
    },
  })
  secretKey?: SecretTypeMap['xApp']['secretKey']

  @Output()
  @Secret<'xApp'>({
    title: 'Encrypted XApp Credentials',
    description: 'The XAPP credentials (key and secretKey) encrypted as a secure secret that can be safely passed between nodes. This encrypted format protects your XAPP credentials while allowing them to be used by compatible nodes in your workflow.',
    secretType: 'xApp',
  })
  encryptedXAPPCredentials?: EncryptedSecretValue<'xApp'>

  async execute(ctx: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.key) {
      throw new Error(`XApp Key is required`)
    }

    if (!this.secretKey) {
      throw new Error(`XApp Secret Key is required`)
    }

    this.encryptedXAPPCredentials = await encryptDirectSecret(ctx, 'xApp', {
      key: this.key,
      secretKey: this.secretKey,
    })

    return {}
  }
}

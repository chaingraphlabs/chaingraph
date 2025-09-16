/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import type { JSONValue } from '../../utils/json'
import { Buffer } from 'node:buffer'
import { subtle } from 'node:crypto'
import { z } from 'zod'

/**
 * Supported types of secrets.
 */
export const secretTypeSchemas = {
  'openai': z.object({
    apiKey: z.string().min(1),
  }),
  '0g': z.object({
    privateKey: z.string().length(64).regex(/^[0-9a-z]+$/i),
  }),
  'anthropic': z.object({
    apiKey: z.string().min(1),
  }),
  'coinmarketcap': z.object({
    apiKey: z.string().min(1),
  }),
  'deepseek': z.object({
    apiKey: z.string().min(1),
  }),
  'groq': z.object({
    apiKey: z.string().min(1),
  }),
  'moonshot': z.object({
    apiKey: z.string().min(1),
  }),
  'xAPI': z.object({
    key: z.string().min(1),
    secretKey: z.string().min(1),
  }),
  'xApp': z.object({
    key: z.string().min(1),
    secretKey: z.string().min(1),
  }),
  'OkxDexApi': z.object({
    apiKey: z.string().min(1),
    secretKey: z.string().min(1),
    apiPassphrase: z.string().min(1),
  }),
  'alchemy': z.object({
    apiKey: z.string().min(32).regex(/^[0-9a-z]+$/i),
  }),
  'string': z.object({
    value: z.string().min(1),
  }),
} satisfies Record<string, z.ZodType<Record<string, string>>>

/**
 * Type map of supported secrets.
 */
export type SecretTypeMap = { [key in keyof typeof secretTypeSchemas]: z.infer<typeof secretTypeSchemas[key]> }

/**
 * Discriminators of supported secret types.
 */
export type SecretType = keyof SecretTypeMap

/**
 * Metadata for a secret field.
 */
interface SecretFieldMetadata {
  /**
   * A textual label of a secret field. Used for displaying in human-readable form.
   */
  label: string

  /**
   * Description of the secret field.
   */
  description: string
}

/**
 * Metadata for a specific type of secret.
 */
export interface SecretTypeMetadata<T extends SecretType> {
  /**
   * A URL of the icon associated with this type of secret.
   */
  icon?: string

  /**
   * A textual label of a secret. Used for displaying in human-readable form.
   */
  label: string

  /**
   * A collection of metadata associated with the fields of a secret type.
   */
  fields: Record<keyof SecretTypeMap[T], SecretFieldMetadata>
}

/**
 * Metadata for all secret types used in the application.
 */
export const secretTypeMetadata = {
  'string': {
    icon: 'https://quicknode.quicknode-ipfs.com/ipfs/QmckiQuap12Vus4USXsPh3aXUMJsV8AFmYqi5YNfiQ7NLr',
    label: 'String Secret',
    fields: {
      value: {
        label: 'Secret Value',
        description: 'Secret Value',
      },
    },
  },
  'openai': {
    icon: 'https://quicknode.quicknode-ipfs.com/ipfs/QmRh59AK1xpgwpSJwexsKNAeibYnVK8TpWZVxMhfoWT8fJ',
    label: 'OpenAI API',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'OpenAI API Key',
      },
    },
  },
  '0g': {
    icon: 'https://quicknode.quicknode-ipfs.com/ipfs/QmbPDxWvQ4G5bsdBkpdsDeubF8nN8HiYoYaRd5K5rmjVAx',
    label: '0G',
    fields: {
      privateKey: {
        label: '0G Private Key',
        description: '0G Private Key for authentication',
      },
    },
  },
  'anthropic': {
    icon: 'https://quicknode.quicknode-ipfs.com/ipfs/QmNhRy7vyrzb6tLGGMdYkKaw8eDH2Q35BPFqvMpTAR5uMh',
    label: 'Anthropic API',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'Anthropic API Key',
      },
    },
  },
  'coinmarketcap': {
    icon: 'https://quicknode.quicknode-ipfs.com/ipfs/QmdcUK961xCEdissP4dSEBQP2xbxiWV4FnCZYeVFuyu8Gz',
    label: 'CoinMarketCap API',
    fields: {
      apiKey: {
        label: 'CoinMarketCap API Key',
        description: 'API Key for CoinMarketCap',
      },
    },
  },
  'deepseek': {
    icon: 'https://quicknode.quicknode-ipfs.com/ipfs/QmQVikh9sjPE2VhFuHTXwZyJinp7XHj3p4FQc7QG9Yrpk7',
    label: 'DeepSeek API',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'API Key for DeepSeek',
      },
    },
  },
  'groq': {
    icon: 'https://quicknode.quicknode-ipfs.com/ipfs/QmUFzx81osVF6p7HQ3EYPFU1FX6yKdV7KTupCShrS8nR44',
    label: 'Groq API',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'API Key for Groq',
      },
    },
  },
  'xAPI': {
    icon: 'https://quicknode.quicknode-ipfs.com/ipfs/Qme4sSRvai1ZLp5JAU6nW99rzBw2n69xRfzSoWoZhVTrC5',
    label: 'X.com API',
    fields: {
      key: {
        label: 'API Key',
        description: 'API Key for X API',
      },
      secretKey: {
        label: 'Secret Key',
        description: 'Secret Key for X API',
      },
    },
  },
  'xApp': {
    icon: 'https://quicknode.quicknode-ipfs.com/ipfs/Qme4sSRvai1ZLp5JAU6nW99rzBw2n69xRfzSoWoZhVTrC5',
    label: 'X.com App',
    fields: {
      key: {
        label: 'App Key',
        description: 'App Key for X App',
      },
      secretKey: {
        label: 'Secret Key',
        description: 'Secret Key for X App',
      },
    },
  },
  'OkxDexApi': {
    icon: 'https://quicknode.quicknode-ipfs.com/ipfs/QmYazRWsyR1uAtEXc1yQkuj3cKyLdhPGeX3kk9bHH2fYgU',
    label: 'OKX DEX API',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'API Key for OKX DEX',
      },
      secretKey: {
        label: 'Secret Key',
        description: 'Secret Key for OKX DEX',
      },
      apiPassphrase: {
        label: 'API Passphrase',
        description: 'API Passphrase for OKX DEX',
      },
    },
  },
  'alchemy': {
    icon: 'https://quicknode.quicknode-ipfs.com/ipfs/QmWHgfZT6RP39Sa6tAAfjHr77h3oqGdbKXoknPqKEPRuia',
    label: 'Alchemy',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'API Key for Alchemy',
      },
    },
  },
  'moonshot': {
    label: 'Moonshot',
    fields: {
      apiKey: {
        label: 'API Key',
        description: 'API key for Moonshot',
      },
    },
  },
} satisfies { [T in SecretType]: SecretTypeMetadata<T> }

/**
 * Map for the compatible secret types between each other.
 * Compatible secret types can be used interchangeably in the same port.
 * For example, 'openai', 'anthropic' and 'string' are compatible with each other
 * because they are all strings.
 */
export const compatibleSecretTypes: Record<SecretType, SecretType[]> = {
  '0g': ['0g'],
  'openai': ['openai', 'anthropic', 'moonshot', 'string'],
  'anthropic': ['openai', 'anthropic', 'string'],
  'coinmarketcap': ['coinmarketcap'],
  'deepseek': ['deepseek'],
  'groq': ['groq'],
  'moonshot': ['moonshot', 'openai'],
  'xAPI': ['xAPI'],
  'xApp': ['xApp'],
  'OkxDexApi': ['OkxDexApi'],
  'alchemy': ['alchemy', 'string'],
  'string': ['openai', 'anthropic', 'alchemy', 'string'],
}

export function isCompatibleSecretType(a: SecretType, b: SecretType): boolean {
  return compatibleSecretTypes[a].includes(b)
}

/**
 * An encrypted value with a method to decrypt this value.
 */
export interface EncryptedSecretValue<T extends SecretType> {
  decrypt: (ctx: ExecutionContext) => Promise<SecretTypeMap[T]>
  encrypted: string
  hkdfNonce: string
  publicKey: string
}

/**
 * Compile time check that given type is a JSONValue.
 */
type ValidateSerializableEncryptedSecretValue<T extends JSONValue> = T

/**
 * Encrypted secret value in a serializable form.
 */
type SerializableEncryptedSecretValue<T extends SecretType>
  = ValidateSerializableEncryptedSecretValue<Omit<EncryptedSecretValue<T>, 'decrypt'>>

/**
 * Schema of an encrypted secret value.
 */
const schema = z.object({
  encrypted: z.string(),
  hkdfNonce: z.string(),
  publicKey: z.string(),
})

/**
 * Deserialize a secret of supported type.
 * @param secretType type of the secret value.
 * @param value the JSON to deserialize the value from.
 *
 * @throws Error if value has an incorrect JSON type. value must be string.
 * @throws Error if secret type is not supported.
 */
export function deserialize<T extends SecretType>(secretType: T, value: JSONValue): EncryptedSecretValue<T> {
  if (!isSupportedSecretType(secretType)) {
    throw new Error(`Unknown secret type: ${secretType}`)
  }

  return wrapSecret(secretType, schema.parse(value))
}

/**
 * Serialize a secret of supported type.
 * @param secretType type of the secret value.
 * @param secret the secret value to serialize.
 *
 * @throws Error if secret type is not supported.
 */
export function serialize<T extends SecretType>(secretType: T, secret: EncryptedSecretValue<T>): JSONValue {
  if (!isSupportedSecretType(secretType)) {
    throw new Error(`Unknown secret type: ${secretType}`)
  }

  return {
    encrypted: secret.encrypted,
    hkdfNonce: secret.hkdfNonce,
    publicKey: secret.publicKey,
  } satisfies SerializableEncryptedSecretValue<T>
}

/**
 * Algorithm used for secret encryption.
 */
const encryptionAlgorithm = {
  name: 'AES-GCM',
  length: 256,
} satisfies AesDerivedKeyParams

/**
 * Algorithm used to derive the encryption key from the ECDH shared secret.
 */
const keyDerivationAlgorithm = {
  name: 'HKDF',
  hash: 'SHA-256',
  info: new ArrayBuffer(),
} satisfies Omit<HkdfParams, 'salt'>

/**
 * Length of IV used in encryption.
 */
const ivLength = 12

/**
 * Wraps an encrypted value to an object with a decrypt function.
 */
export function wrapSecret<T extends SecretType>(secretType: T, value: SerializableEncryptedSecretValue<T>): EncryptedSecretValue<T> {
  const schema = secretTypeSchemas[secretType]
  const decrypt = async (ctx: ExecutionContext) => {
    const keyPair = await ctx.getECDHKeyPair()

    const sharedSecret = await subtle.deriveKey({
      name: 'ECDH',
      public: await subtle.importKey('raw', Buffer.from(value.publicKey, 'base64'), {
        name: 'ECDH',
        namedCurve: 'P-256',
      }, false, []),
    }, keyPair.privateKey, keyDerivationAlgorithm, false, ['deriveKey'])

    const encryptionKey = await subtle.deriveKey({
      ...keyDerivationAlgorithm,
      salt: Buffer.from(value.hkdfNonce, 'base64'),
    }, sharedSecret, encryptionAlgorithm, false, ['decrypt'])

    const encrypted = Buffer.from(value.encrypted, 'base64')

    const iv = encrypted.subarray(0, ivLength)
    const data = encrypted.subarray(ivLength)

    const decrypted = await subtle.decrypt({
      ...encryptionAlgorithm,
      iv,
    }, encryptionKey, data)

    return schema.parse(JSON.parse(Buffer.from(decrypted).toString())) as SecretTypeMap[T]
  }

  return {
    decrypt,
    encrypted: value.encrypted,
    hkdfNonce: value.hkdfNonce,
    publicKey: value.publicKey,
  }
}

/**
 * Type guard that narrows the type of the given string to a {@link SecretType}.
 * @param t A string that might be a {@link SecretType}.
 */
export function isSupportedSecretType(t: string): t is SecretType {
  return t in secretTypeSchemas
}

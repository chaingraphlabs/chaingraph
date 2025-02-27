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
const secretTypeSchemas = {
  openai: z.string().min(1),
  x: z.string().min(1),
  string: z.string().min(1),
} satisfies Record<string, z.ZodType>

/**
 * Type map of supported secrets.
 */
export type SecretTypeMap = { [key in keyof typeof secretTypeSchemas]: z.infer<typeof secretTypeSchemas[key]> }

/**
 * Discriminators of supported secret types.
 */
export type SecretType = keyof SecretTypeMap

/**
 * Supported value types of secrets.
 */
export type SecretValue = SecretTypeMap[SecretType]

/**
 * An encrypted value with a method to decrypt this value.
 */
export interface EncryptedSecretValue<T extends SecretValue> {
  decrypt: (ctx: ExecutionContext) => Promise<T>
  encrypted: Buffer<ArrayBufferLike>
  publicKey: CryptoKey
}

/**
 * Compile time check that given type is a JSONValue.
 */
type ValidateSerializableEncryptedSecretValue<T extends JSONValue> = T

/**
 * Encrypted secret value in a serializable form.
 */
type SerializableEncryptedSecretValue<T extends SecretType> =
  ValidateSerializableEncryptedSecretValue<Omit<EncryptedSecretValue<T>, 'decrypt'>>

/**
 * Schema of an encrypted secret value.
 */
const schema = z.object({
  encrypted: z.instanceof(Buffer),
  publicKey: z.instanceof(CryptoKey),
})

/**
 * Deserialize a secret of supported type.
 * @param secretType type of the secret value.
 * @param value the JSON to deserialize the value from.
 *
 * @throws Error if value has an incorrect JSON type. value must be string.
 * @throws Error if secret type is not supported.
 */
export function deserialize<T extends SecretType>(secretType: T, value: JSONValue): EncryptedSecretValue<SecretTypeMap[T]> {
  switch (secretType) {
    case 'openai':
    case 'x':
    case 'string':
      return wrap(secretType, schema.parse(value))
    default:
      throw new Error(`Unknown secret type: ${secretType satisfies never}`)
  }
}

/**
 * Serialize a secret of supported type.
 * @param secretType type of the secret value.
 * @param secret the secret value to serialize.
 *
 * @throws Error if secret type is not supported.
 */
export function serialize<T extends SecretType>(secretType: T, secret: EncryptedSecretValue<SecretTypeMap[T]>): JSONValue {
  switch (secretType) {
    case 'openai':
    case 'x':
    case 'string':
      return {
        encrypted: secret.encrypted,
        publicKey: secret.publicKey,
      } satisfies SerializableEncryptedSecretValue<T>
    default:
      throw new Error(`Unknown secret type: ${secretType satisfies never}`)
  }
}

/**
 * Wraps an encrypted value to an object with a decrypt function.
 */
function wrap<T extends SecretType>(secretType: T, value: SerializableEncryptedSecretValue<T>): EncryptedSecretValue<SecretTypeMap[T]> {
  const schema = secretTypeSchemas[secretType]
  const decrypt = async (ctx: ExecutionContext) => {
    const keyPair = await ctx.getECDHKeyPair()

    const encryptionKey = await subtle.deriveKey({
      name: 'ECDH',
      public: value.publicKey,
    }, keyPair.privateKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])

    const iv = value.encrypted.subarray(0, 12)
    const data = value.encrypted.subarray(12)

    const decrypted = await subtle.decrypt({ name: 'AES-GCM', length: 256, iv }, encryptionKey, data)
    return schema.parse(Buffer.from(decrypted).toString())
  }

  return {
    decrypt,
    encrypted: value.encrypted,
    publicKey: value.publicKey,
  }
}

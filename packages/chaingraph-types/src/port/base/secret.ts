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
  xAPI: z.object({
    key: z.string().min(1),
    secretKey: z.string().min(1),
  }),
  xApp: z.object({
    key: z.string().min(1),
    secretKey: z.string().min(1),
  }),
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
 * An encrypted value with a method to decrypt this value.
 */
export interface EncryptedSecretValue<T extends SecretType> {
  decrypt: (ctx: ExecutionContext) => Promise<SecretTypeMap[T]>
  encrypted: ArrayBuffer
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
  encrypted: z.instanceof(ArrayBuffer),
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
    publicKey: secret.publicKey,
  } satisfies SerializableEncryptedSecretValue<T>
}

/**
 * Algorithm used for secret encryption.
 */
const encryptionAlgorithm = {
  name: 'AES-GCM',
  length: 256,
}

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

    const encryptionKey = await subtle.deriveKey({
      name: 'ECDH',
      public: value.publicKey,
    }, keyPair.privateKey, encryptionAlgorithm, false, ['decrypt'])

    const iv = value.encrypted.slice(0, ivLength)
    const data = value.encrypted.slice(ivLength)

    const decrypted = await subtle.decrypt({
      ...encryptionAlgorithm,
      iv,
    }, encryptionKey, data)
    return schema.parse(JSON.parse(Buffer.from(decrypted).toString())) as SecretTypeMap[T]
  }

  return {
    decrypt,
    encrypted: value.encrypted,
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

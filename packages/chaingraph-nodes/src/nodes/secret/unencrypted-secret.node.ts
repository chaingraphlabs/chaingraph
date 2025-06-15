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
  IPort,
  IPortConfig,
  NodeEvent,
  NodeExecutionResult,
  ObjectPort,
  PortUpdateEvent,
  SecretPort,
  SecretType,
  SecretTypeMap,
} from '@badaitech/chaingraph-types'
import { Buffer } from 'node:buffer'

import { subtle } from 'node:crypto'
import {
  wrapSecret,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  NodeEventType,
  Output,
  PortEnum,
  PortObject,
  PortSecret,
  secretTypeMetadata,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Unencrypted Secret',
  description: 'Converts plain text sensitive data into encrypted secrets. WARNING: Input data is stored unencrypted in the flow configuration - use only for development or when security is not critical.',
  category: NODE_CATEGORIES.SECRET,
  tags: ['secret', 'vault'],
  type: 'UnencryptedSecret',
})
export class UnencryptedSecretNode extends BaseNode {
  @Input()
  @PortEnum({
    title: 'Secret Type',
    description: 'Type of secret to encrypt unencrypted data',
    options: Object.entries(secretTypeMetadata).map(([key, metadata]) => ({
      id: key,
      type: 'string',
      defaultValue: key,
      title: metadata.label,
    })),

    defaultValue: undefined,
  })
  secretType?: SecretType = undefined

  @Input()
  @PortObject({
    title: 'Unencrypted Data',
    description: 'The unencrypted data to be encrypted as a secret',
    schema: {
      properties: {},
    },
    isSchemaMutable: false,
    ui: {
      hidePropertyEditor: false,
      collapsed: true,
    },
    defaultValue: {},
  })
  unencryptedData: Record<string, any> = {}

  @Output()
  @PortSecret({
    title: 'Secret Value',
    description: 'The encrypted secret value',
    secretType: 'string',
  })
  secret?: EncryptedSecretValue<SecretType>

  async onEvent(event: NodeEvent): Promise<void> {
    if (event.type === NodeEventType.PortUpdate) {
      return this.handlePortUpdate(event as PortUpdateEvent)
    }
  }

  private async handlePortUpdate(event: PortUpdateEvent): Promise<void> {
    if (event.port.key === 'secretType') {
      const secretType = event.port.getValue() as SecretType
      if (!secretType) {
        const unencryptedDataPort = this.findPortByKey('unencryptedData') as ObjectPort | undefined
        if (unencryptedDataPort) {
          // Remove all existing fields from the unencryptedData port schema
          for (const fieldKey of Object.keys(unencryptedDataPort.getConfig().schema.properties)) {
            this.removeObjectProperty(unencryptedDataPort as IPort, fieldKey)
          }
          await this.updatePort(unencryptedDataPort as IPort)
        }

        const secretPort = this.findPortByKey('secret') as SecretPort<any> | undefined
        if (secretPort) {
          // Reset the secret port configuration
          secretPort.setConfig({
            ...secretPort.getConfig(),
            secretType: 'string',
          })
          await this.updatePort(secretPort as IPort)
        }

        return
      }

      // Validate the secret type
      if (!secretTypeMetadata[secretType]) {
        throw new Error(`Unknown secret type: ${secretType}`)
      }

      // Create an unencryptedData object schema based on the selected secret type
      const secretFields = secretTypeMetadata[secretType].fields
      const unencryptedDataSchema: Record<string, IPortConfig> = {}
      for (const [fieldKey, fieldMetadata] of Object.entries(secretFields)) {
        unencryptedDataSchema[fieldKey] = {
          type: 'string',
          title: fieldMetadata.label,
          description: `Unencrypted value for ${fieldMetadata.label}: ${fieldMetadata.description}`,
          required: true,
          ui: {
            isPassword: true,
          },
        }
      }

      // Update the unencryptedData port with the new schema
      const unencryptedDataPort = this.findPortByKey('unencryptedData') as ObjectPort | undefined
      if (!unencryptedDataPort) {
        throw new Error('Unencrypted Data port not found')
      }

      // remove all exisitng fields from the schema
      for (const fieldKey of Object.keys(unencryptedDataPort.getConfig().schema.properties)) {
        this.removeObjectProperty(unencryptedDataPort as IPort, fieldKey)
      }

      // Add new fields to the unencryptedData port schema
      for (const [fieldKey, fieldConfig] of Object.entries(unencryptedDataSchema)) {
        this.addObjectProperty(unencryptedDataPort as IPort, fieldKey, fieldConfig)
      }

      const secretPort = this.findPortByKey('secret') as SecretPort<any> | undefined
      if (!secretPort) {
        throw new Error('Secret port not found')
      }

      // Update the secret port with the new secret type
      secretPort.setConfig({
        ...secretPort.getConfig(),
        secretType,
      })

      await this.updatePort(secretPort as IPort)
      await this.updatePort(unencryptedDataPort as IPort)
    }
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.secretType) {
      throw new Error('Secret type is not set')
    }

    if (!this.unencryptedData || Object.keys(this.unencryptedData).length === 0) {
      throw new Error('Unencrypted data is empty')
    }

    const secretPort = this.findPortByKey('secret') as SecretPort<any> | undefined
    if (!secretPort) {
      throw new Error('Secret port not found')
    }

    // Update the secret port with the new secret type
    secretPort.setConfig({
      ...secretPort.getConfig(),
      secretType: this.secretType,
    })
    secretPort.setValue(
      await this.encryptDirectSecret(
        context,
        this.secretType,
        this.unencryptedData as SecretTypeMap[typeof this.secretType],
      ),
    )
    await this.updatePort(secretPort as IPort)

    return {}
  }

  async encryptDirectSecret<T extends SecretType>(
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
}

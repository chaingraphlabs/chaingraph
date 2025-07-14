/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArchAIContext,
  EncryptedSecretValue,
  ExecutionContext,
  IPort,

  NodeExecutionResult,
  SecretPort,
  SecretType,
} from '@badaitech/chaingraph-types'

import { Buffer } from 'node:buffer'
import { subtle } from 'node:crypto'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import {
  BaseNode,
  Input,
  isSupportedSecretType,
  Node,
  Output,
  PortSecret,
  PortString,
  wrapSecret,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'ArchAI Secret Vault',
  description: 'Retrieves a secret from the secret vault',
  category: NODE_CATEGORIES.SECRET,
  tags: ['secret', 'vault'],
  type: 'SecretNode',
})
export class SecretNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Secret ID',
    description: 'The ID of the secret to retrieve',
  })
  secretID?: string

  @Output()
  @PortSecret({
    title: 'Secret Value',
    description: 'The secret value',
    secretType: 'string',
  })
  secret?: EncryptedSecretValue<SecretType>

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.secretID) {
      throw new Error('No secretID provided')
    }

    // Get required context information
    const archAIContext = context.getIntegration<ArchAIContext>('archai')

    const agentSession = archAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    const keyPair = await context.getECDHKeyPair()
    const { secret } = await graphQLClient.request(GraphQL.ReadSecretDocument, {
      id: this.secretID,
      publicKey: Buffer.from(await subtle.exportKey('raw', keyPair.publicKey)).toString('base64'),
      session: agentSession,
    })

    const secretType = secret.secret.metadata.type
    if (!isSupportedSecretType(secretType)) {
      throw new Error(`Unknown secret type ${secretType}`)
    }

    const secretPort = this.findPortByKey('secret') as SecretPort<SecretType>
    if (secretPort) {
      secretPort.setConfig({
        ...secretPort.getConfig(),
        secretType,
      })
      secretPort.setValue(wrapSecret(secretType, {
        encrypted: secret.secret.encrypted,
        hkdfNonce: secret.hkdfNonce,
        publicKey: secret.publicKey,
      }))
      await this.updatePort(secretPort as IPort)
    }

    return {}
  }
}

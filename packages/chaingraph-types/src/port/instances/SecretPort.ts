/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type { IPort, SecretPortConfig, SecretPortValue } from '../base'
import type { SecretType } from '../base/secret'
import { isCompatibleSecretType } from '../base'
import { BasePort } from '../base'
import { generatePortID } from '../id-generate'
import { SecretPortPlugin } from '../plugins/SecretPortPlugin'

/**
 * Concrete implementation of a SecretPort.
 */
export class SecretPort<S extends SecretType> extends BasePort<SecretPortConfig<S>> {
  constructor(config: SecretPortConfig<S>) {
    const defaultUi = {
      bgColor: '#008080', // Teal
      borderColor: '#004040', // Dark Teal
    }

    const mergedConfig = { ...config, ui: { ...defaultUi, ...config.ui } }
    super(mergedConfig)
  }

  /**
   * @inheritDoc
   *
   * @returns undefined.
   */
  getDefaultValue(): undefined {
    return undefined
  }

  /**
   * @inheritDoc
   */
  validateValue(value: SecretPortValue<S>): boolean {
    return SecretPortPlugin.validateValue(value, this.config).length === 0
  }

  /**
   * @inheritDoc
   */
  validateConfig(config: SecretPortConfig<S>): boolean {
    return SecretPortPlugin.validateConfig(config).length === 0
  }

  /**
   * @inheritDoc
   */
  serializeConfig(config: SecretPortConfig<S>): JSONValue {
    return SecretPortPlugin.serializeConfig(config)
  }

  /**
   * @inheritDoc
   */
  serializeValue(value: SecretPortValue<S>): JSONValue {
    return SecretPortPlugin.serializeValue(value, this.config)
  }

  /**
   * @inheritDoc
   */
  deserializeConfig(data: JSONValue): SecretPortConfig<S> {
    return SecretPortPlugin.deserializeConfig(data)
  }

  /**
   * @inheritDoc
   */
  deserializeValue(data: JSONValue): SecretPortValue<S> {
    return SecretPortPlugin.deserializeValue(data, this.config) as SecretPortValue<S>
  }

  cloneWithNewId(): IPort<SecretPortConfig<S>> {
    const port = new SecretPort<S>({
      ...this.config,
      id: generatePortID(this.config.key || this.config.id || ''),
    })
    if (this.value) {
      port.setValue(this.value) // Set the current value
    }
    return port
  }

  isCompatibleWith(otherPort: IPort): boolean {
    const sourcePortKind = this.getConfig().type
    const targetPortKind = otherPort.getConfig().type

    if (sourcePortKind !== targetPortKind) {
      throw new Error(`Incompatible secret port types: ${sourcePortKind} -> ${targetPortKind}`)
    }

    if (sourcePortKind === 'secret' && targetPortKind === 'secret') {
      const sourceSecretPort = this as SecretPort<S>
      const targetSecretPort = otherPort as SecretPort<SecretType>

      if (!isCompatibleSecretType(
        sourceSecretPort.getConfig().secretType,
        targetSecretPort.getConfig().secretType,
      )) {
        throw new Error(`Incompatible secret types: ${sourceSecretPort.getConfig().secretType} -> ${targetSecretPort.getConfig().secretType}`)
      }
    }

    return true
  }
}

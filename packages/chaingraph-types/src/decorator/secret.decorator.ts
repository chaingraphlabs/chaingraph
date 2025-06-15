/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { SecretType } from '../port'
import type { PortDecoratorOptions } from './port.decorator.types'
import { Port } from './port.decorator'

type SecretDecoratorConfig<S extends SecretType> =
  Omit<PortDecoratorOptions<'secret'>, 'type' | 'defaultValue'>
  & {
    secretType: S
  }

/**
 * Decorator to specify a type configuration for type "secret".
 */
export function PortSecret<S extends SecretType>(config?: SecretDecoratorConfig<S>): PropertyDecorator {
  return Port({
    type: 'secret',
    secretType: 'string',
    defaultValue: undefined,
    ...config,
  })
}

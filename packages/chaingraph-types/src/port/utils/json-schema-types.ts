/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export type {
  JsonSchema7AnyType,
} from 'zod-to-json-schema'

export type {
  JsonSchema7ArrayType,
} from 'zod-to-json-schema'

export type {
  JsonSchema7BooleanType,
} from 'zod-to-json-schema'

export type {
  JsonSchema7EnumType,
} from 'zod-to-json-schema'

export type {
  JsonSchema7LiteralType,
} from 'zod-to-json-schema'

export type {
  JsonSchema7NullType,
} from 'zod-to-json-schema'

export type {
  JsonSchema7NumberType,
} from 'zod-to-json-schema'

export type {
  JsonSchema7ObjectType,
} from 'zod-to-json-schema'

export type {
  JsonSchema7StringType,
} from 'zod-to-json-schema'

export type {
  JsonSchema7UnionType,
} from 'zod-to-json-schema'

export type {
  JsonSchema7Type,
  JsonSchema7TypeUnion,
} from 'zod-to-json-schema'

export interface JsonSchema7RefType {
  $ref: string
}

export interface JsonSchema7Meta {
  title?: string
  default?: any
  description?: string
  markdownDescription?: string
}

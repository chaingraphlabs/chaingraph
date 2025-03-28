/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CodegenConfig } from '@graphql-codegen/cli'

export default {
  overwrite: true,
  documents: 'src/gql/queries/**/*.graphql',
  schema: 'http://localhost:9151/graphql',
  generates: {
    'src/gql/client/': {
      preset: 'client',
      config: {
        scalars: {
          ECDHPublicKeyP256: 'string',
          BlobBase64: 'string',
        },
      },
    },
  },
} satisfies CodegenConfig

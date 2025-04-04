/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { init } from '@badaitech/chaingraph-trpc/server'
import dotenv from 'dotenv'
import { setupPolyfills } from './setup'
import { wsServer } from './ws-server'

dotenv.config({ path: '../../.env' })

setupPolyfills()

init()

wsServer()

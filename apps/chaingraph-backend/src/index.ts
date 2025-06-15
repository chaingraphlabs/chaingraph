/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { setMaxListeners } from 'node:events'
import process from 'node:process'
import { init } from '@badaitech/chaingraph-trpc/server'
import { prettyPrintConfig } from './config'
import { setupPolyfills } from './setup-polyfills'
import { wsServer } from './ws-server'
import './config'

setMaxListeners(100000)
process.setMaxListeners(0)

setupPolyfills()

prettyPrintConfig()

init()

wsServer()

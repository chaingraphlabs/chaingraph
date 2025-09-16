/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata } from '@badaitech/chaingraph-types'
import type { IMCPStore } from './mcp/stores/types'
import type { IFlowStore } from './stores/flowStore/types'
import process from 'node:process'
import { getCategoriesMetadata } from '@badaitech/chaingraph-nodes'
import { NodeCatalog, NodeRegistry, registerSuperjsonTransformers } from '@badaitech/chaingraph-types'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import SuperJSON from 'superjson'
import { authConfig } from './auth/config'
import { initializeContext } from './context'
import { InMemoryMCPStore, PostgresMCPStore } from './mcp/stores'
import { DBFlowStore } from './stores/flowStore/dbFlowStore'
import { InMemoryFlowStore } from './stores/flowStore/inMemoryFlowStore'

export async function init() {
  process.setMaxListeners(0)
  registerSuperjsonTransformers(SuperJSON, NodeRegistry.getInstance())

  if (authConfig.enabled) {
    console.log('\n=== Authentication Configuration ===')
    if (authConfig.devMode) {
      console.log('🔓 Auth is enabled but running in DEV MODE:')
      console.log('   • All requests will be allowed regardless of authentication')
      console.log('   • User roles will not be enforced')
    } else {
      console.log('🔒 tRPC server Authentication is ENABLED and enforced')
      if (authConfig.badaiAuth.enabled) {
        console.log('   🧪 BadAI Auth provider: Active')
        console.log(`   • API URL: ${authConfig.badaiAuth.apiUrl}`)
      } else {
        console.log('   ❌ No authentication provider is configured')
        console.log('   • To enable BadaI Auth: set BADAI_AUTH_ENABLED=true and configure BADAI_API_URL')
        console.log('   • For development: set AUTH_DEV_MODE=true to bypass authentication checks')
        throw new Error('Authentication is enabled but no auth provider is configured')
      }
    }
    console.log('===================================\n')
  } else {
    console.log('\n=== Authentication Configuration ===')
    console.log('🔓 Authentication is DISABLED')
    console.log('   • All requests will be allowed without authentication')
    console.log('   • To enable authentication, set AUTH_ENABLED=true')
    console.log('===================================\n')
  }

  // Initialize stores and context
  const db = drizzle(process.env.DATABASE_URL!)
  let flowStore: IFlowStore = new InMemoryFlowStore()
  let mcpStore: IMCPStore = new InMemoryMCPStore()

  // ping to check if the connection is successful
  try {
    const res = await db.execute(sql`select 1`)
    if (!res || res.rows.length === 0) {
      throw new Error('DB connection failed')
    }
    console.log('DB connection successful')
    flowStore = new DBFlowStore(db)
    mcpStore = new PostgresMCPStore(db)
  } catch (error) {
    console.error('DB connection failed, using in-memory store. If you would like to use a database, please set DATABASE_URL environment variable.')
  }

  const nodesCatalog = new NodeCatalog()

  initializeContext(
    db,
    flowStore,
    NodeRegistry.getInstance(),
    nodesCatalog,
    mcpStore,
  )

  // register categories
  getCategoriesMetadata().forEach((metadata: CategoryMetadata) => {
    nodesCatalog.registerCategory(metadata.id, metadata)
  })
  // register nodes
  NodeRegistry.getInstance().getNodeTypes().forEach((type) => {
    const node = NodeRegistry.getInstance().createNode(type, `${type}-catalog`)
    nodesCatalog.registerNode(type, node)
  })
}

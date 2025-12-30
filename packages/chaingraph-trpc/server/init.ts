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
import { PgOwnershipResolver } from './stores/ownership'
import { PgUserStore } from './stores/userStore'

interface InitConfig {
  useFlowStoreCache?: boolean
}

export async function init(
  config: InitConfig = {
    useFlowStoreCache: true,
  },
) {
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

      // Demo Auth Configuration
      if (authConfig.demoAuth.enabled) {
        console.log('   🎭 Demo Auth: Enabled')
        // Validate demo token secret is configured
        if (!process.env.DEMO_TOKEN_SECRET) {
          console.error('   ❌ DEMO_TOKEN_SECRET environment variable is not set')
          console.error('   • Demo user authentication requires a secure secret')
          console.error('   • Generate a secret: openssl rand -base64 64')
          console.error('   • Set DEMO_TOKEN_SECRET in your environment')
          throw new Error('DEMO_TOKEN_SECRET is required when demo auth is enabled in production')
        }
        console.log('   • Demo token secret configured')
      } else {
        console.log('   🎭 Demo Auth: Disabled')
        console.log('   • To enable demo users: set DEMO_AUTH_ENABLED=true (or remove DEMO_AUTH_ENABLED to use default)')
      }

      // BadAI Auth Configuration
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
  const userStore = new PgUserStore(db)

  // ping to check if the connection is successful
  try {
    const res = await db.execute(sql`select 1`)
    if (!res || res.rows.length === 0) {
      throw new Error('DB connection failed')
    }
    console.log('DB connection successful')

    // Validate required tables exist
    const tableCheck = await db.execute(sql`
      SELECT
        (SELECT to_regclass('public.chaingraph_users')) as users_table,
        (SELECT to_regclass('public.chaingraph_external_accounts')) as accounts_table
    `)

    const { users_table, accounts_table } = tableCheck.rows[0] as { users_table: string | null, accounts_table: string | null }

    if (!users_table || !accounts_table) {
      const missing: string[] = []
      if (!users_table)
        missing.push('chaingraph_users')
      if (!accounts_table)
        missing.push('chaingraph_external_accounts')

      console.error('\n❌ Required database tables are missing:')
      missing.forEach(table => console.error(`   • ${table}`))
      console.error('\n   User management tables are required for authentication.')
      console.error('   Please run database migrations:')
      console.error('   1. cd packages/chaingraph-trpc')
      console.error('   2. pnpm run migrate')
      console.error('')
      throw new Error(`Missing required tables: ${missing.join(', ')}. Run migrations first.`)
    }

    console.log('✅ All required user management tables exist')

    const ownershipResolver = new PgOwnershipResolver(userStore)
    flowStore = new DBFlowStore(
      db,
      config.useFlowStoreCache ?? true,
      NodeRegistry.getInstance(),
      ownershipResolver,
    )
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
    userStore,
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

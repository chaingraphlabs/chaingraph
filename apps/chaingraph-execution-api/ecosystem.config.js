/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/*
 * PM2 Ecosystem Configuration
 *
 * This file configures PM2 to run multiple instances of the tRPC server
 * with automatic load balancing and process management.
 */

module.exports = {
  apps: [{
    name: 'trpc-server',
    script: './dist/index.js',
    instances: process.env.INSTANCES || 4,
    exec_mode: 'cluster',
    instance_var: 'NODE_APP_INSTANCE',

    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || '4021',
      DATABASE_URL: process.env.DATABASE_URL,
      KAFKA_BROKERS: process.env.KAFKA_BROKERS,
    },

    // Logging
    error_file: '/var/log/pm2/error.log',
    out_file: '/var/log/pm2/out.log',
    merge_logs: true,
    time: true,

    // Process management
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,

    // Health monitoring
    autorestart: true,
    watch: false,
  }],
}

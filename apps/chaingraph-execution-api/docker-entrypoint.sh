#!/bin/bash
#
# Copyright (c) 2025 BadLabs
#
# Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
#
# As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
#

set -e

# Configuration
INSTANCES=${INSTANCES:-4}
BASE_PORT=${BASE_PORT:-4021}

echo "========================================="
echo "Starting tRPC Server with PM2 and nginx"
echo "Instances: $INSTANCES"
echo "Base Port: $BASE_PORT"
echo "========================================="

# Generate nginx upstream configuration
echo "Generating nginx upstream configuration..."

UPSTREAM_CONFIG="upstream trpc_backend {
    ip_hash;  # Sticky sessions for WebSocket"

for i in $(seq 0 $((INSTANCES - 1))); do
    PORT=$((BASE_PORT + i))
    UPSTREAM_CONFIG="$UPSTREAM_CONFIG
    server 127.0.0.1:$PORT max_fails=3 fail_timeout=30s;"
done

UPSTREAM_CONFIG="$UPSTREAM_CONFIG
}"

# Create the final nginx configuration
sed "s|# UPSTREAM_PLACEHOLDER|$UPSTREAM_CONFIG|" /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf

echo "nginx configuration generated with $INSTANCES upstream servers"

# Start nginx in background
echo "Starting nginx..."
nginx

# Export environment variables for PM2
export INSTANCES=$INSTANCES
export PORT=$BASE_PORT

# Start PM2 with the configured number of instances
echo "Starting PM2 with $INSTANCES instances..."
exec pm2-runtime start ecosystem.config.js --instances $INSTANCES
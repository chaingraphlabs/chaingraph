# Use the base packages image
ARG PACKAGES_IMAGE=ghcr.io/badaitech/chaingraph-packages:latest
FROM ${PACKAGES_IMAGE} AS packages

FROM node:22.14.0-alpine AS base

WORKDIR /app

# Install pnpm and turbo
RUN npm install -g pnpm@10.5.2 turbo@2.5.0

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ ca-certificates

# First stage: Prune the monorepo for execution-api
FROM base AS pruner

# Copy the entire workspace (needed for turbo prune)
COPY . .
RUN turbo prune "@badaitech/chaingraph-execution-api" --docker

# Second stage: Install dependencies and build execution-api
FROM base AS builder

ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV NODE_ENV=production

# Copy pruned package files
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy built packages from base image
COPY --from=packages /packages/ ./packages/

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Build the execution-api application
RUN pnpm turbo run build --filter=@badaitech/chaingraph-execution-api

# Runtime stage with nginx and PM2
FROM node:22.14.0-alpine AS runner

ARG NODE_ENV=production
ARG INSTANCES=4
ARG PORT=4021

WORKDIR /app

# Install nginx, PM2, bash, wget (for health check)
RUN apk add --no-cache nginx bash wget \
    && npm install -g pm2 pnpm@10.5.2

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser

# Copy package files for production dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy built execution-api application
COPY --from=builder --chown=nodeuser:nodejs /app/apps/chaingraph-execution-api/dist/ ./apps/chaingraph-execution-api/dist/

# Copy built packages
COPY --from=packages --chown=nodeuser:nodejs /packages/ ./packages/

# Copy configuration files
COPY --chown=nodeuser:nodejs apps/chaingraph-execution-api/ecosystem.config.js ./
COPY apps/chaingraph-execution-api/nginx/nginx.template.conf /etc/nginx/
COPY --chown=nodeuser:nodejs apps/chaingraph-execution-api/docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Create necessary directories with proper permissions
RUN mkdir -p /var/log/pm2 /var/log/nginx /run/nginx && \
    chown -R nodeuser:nodejs /var/log/pm2

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    chown -R nodeuser:nodejs /app

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=${NODE_ENV} \
    INSTANCES=${INSTANCES} \
    PORT=${PORT}

# Expose nginx port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/nginx-health || exit 1

# Start the application
ENTRYPOINT ["/docker-entrypoint.sh"]
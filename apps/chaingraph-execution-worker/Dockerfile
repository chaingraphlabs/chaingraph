# Use the base packages image
ARG PACKAGES_IMAGE=ghcr.io/badaitech/chaingraph-packages:latest
FROM ${PACKAGES_IMAGE} AS packages

FROM node:22.14.0-alpine AS base

WORKDIR /app

# Install pnpm and turbo
RUN npm install -g pnpm@10.5.2 turbo@2.5.0

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ ca-certificates

# First stage: Prune the monorepo for execution-worker
FROM base AS pruner

# Copy the entire workspace (needed for turbo prune)
COPY . .
RUN turbo prune "@badaitech/chaingraph-execution-worker" --docker

# Second stage: Install dependencies and build execution-worker
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

# Build the execution-worker application
RUN pnpm turbo run build --filter=@badaitech/chaingraph-execution-worker

# Final stage: Run the application
FROM base AS runner

ARG NODE_ENV=production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser

# Install pnpm for production dependencies
RUN npm install -g pnpm@10.5.2
RUN apk add --no-cache python3 make g++

# Copy package files for production dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install production dependencies only
RUN pnpm install --frozen-lockfile && \
    chown -R nodeuser:nodejs /app

# Copy built execution-worker application
COPY --from=builder --chown=nodeuser:nodejs /app/apps/chaingraph-execution-worker/dist/ ./apps/chaingraph-execution-worker/dist/

# Copy built packages
COPY --from=packages --chown=nodeuser:nodejs /packages/ ./packages/

USER nodeuser

ENV NODE_ENV=${NODE_ENV}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

CMD ["node", "apps/chaingraph-execution-worker/dist/index.cjs"]
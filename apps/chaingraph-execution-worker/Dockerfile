FROM node:24.11.1-alpine AS base

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

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Build the execution-worker application and all its dependencies
RUN pnpm turbo run build --filter=@badaitech/chaingraph-execution-worker...

# Final stage: Run the application
FROM node:24.11.1-alpine AS runner

ARG NODE_ENV=production

WORKDIR /app

# Install pnpm (needed for production install)
RUN npm install -g pnpm@10.5.2

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser

# Copy package files for production dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy built execution-worker application
COPY --from=builder --chown=nodeuser:nodejs /app/apps/chaingraph-execution-worker/dist/ ./apps/chaingraph-execution-worker/dist/

# Copy built packages
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-executor/dist/ ./packages/chaingraph-executor/dist/
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-nodes/src/ ./packages/chaingraph-nodes/src/
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-trpc/client/ ./packages/chaingraph-trpc/client/
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-trpc/server/ ./packages/chaingraph-trpc/server/
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-types/src/ ./packages/chaingraph-types/src/

# Install production dependencies and change ownership
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    chown -R nodeuser:nodejs /app

USER nodeuser

ENV NODE_ENV=${NODE_ENV}

CMD ["node", "apps/chaingraph-execution-worker/dist/index.js"]
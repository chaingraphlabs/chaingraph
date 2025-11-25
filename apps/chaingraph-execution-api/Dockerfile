FROM node:24.11.1-alpine AS base

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

# Copy pruned source code
COPY --from=pruner /app/out/full/ .

# Build the execution-api application and all its dependencies
RUN pnpm turbo run build --filter=@badaitech/chaingraph-execution-api...

# Runtime stage - minimal Node.js runtime
FROM node:24.11.1-alpine AS runner

ARG NODE_ENV=production
ARG PORT=4021

WORKDIR /app

# Install pnpm (needed for production install)
RUN npm install -g pnpm@10.5.2

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser

# Copy package files for production dependencies
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy built execution-api application
COPY --from=builder --chown=nodeuser:nodejs /app/apps/chaingraph-execution-api/dist/ ./apps/chaingraph-execution-api/dist/

# Copy built packages
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-executor/dist/ ./packages/chaingraph-executor/dist/
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-trpc/client/ ./packages/chaingraph-trpc/client/
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-trpc/server/ ./packages/chaingraph-trpc/server/
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-types/src/ ./packages/chaingraph-types/src/

# Install production dependencies and change ownership
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Environment variables
ENV NODE_ENV=${NODE_ENV} \
    PORT=${PORT}

# Expose the application port
EXPOSE ${PORT}

# Health check - simple HTTP check on the application port
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Start the application directly
CMD ["node", "apps/chaingraph-execution-api/dist/index.js"]
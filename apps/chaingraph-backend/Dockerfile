# Use the base packages image
ARG PACKAGES_IMAGE=ghcr.io/badaitech/chaingraph-packages:latest
FROM ${PACKAGES_IMAGE} AS packages

FROM node:22.14.0-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.5.2 turbo@2.5.0

# Install build dependencies for native modules and CA certificates
RUN apk add --no-cache python3 make g++ ca-certificates

# First stage: Prune the monorepo
FROM base AS pruner

COPY . .
RUN turbo prune "@badaitech/chaingraph-backend" --docker

# Second stage: Install dependencies and build
FROM base AS builder

ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV NODE_ENV=production

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

# Copy built packages from base image
COPY --from=packages /packages/ ./packages/

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@badaitech/chaingraph-backend

# Final stage: Run the application
FROM base AS runner

ARG NODE_ENV=production
ARG PORT=3001

WORKDIR /app

RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

COPY --from=builder --chown=nodeuser:nodejs /app/apps/chaingraph-backend/dist/ ./apps/chaingraph-backend/dist/

# Copy built packages from base image
COPY --from=packages --chown=nodeuser:nodejs /packages/ ./packages/

RUN pnpm install --prod --no-frozen-lockfile --ignore-scripts && \
    chown -R nodeuser:nodejs /app

USER nodeuser

ENV NODE_ENV=${NODE_ENV}
EXPOSE ${PORT}

CMD ["node", "apps/chaingraph-backend/dist/index.cjs"]
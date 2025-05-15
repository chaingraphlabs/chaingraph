FROM node:22.12.0-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.3.0 turbo@2.5.0

# First stage: Prune the monorepo
FROM base AS pruner

COPY . .
RUN turbo prune "@badaitech/chaingraph-backend" --docker

# Second stage: Install dependencies and build
FROM base AS builder

ENV NODE_OPTIONS="--max-old-space-size=8192"

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@badaitech/chaingraph-backend...

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
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-nodes/src/ ./packages/chaingraph-nodes/src/
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-types/src/ ./packages/chaingraph-types/src/
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-trpc/client/ ./packages/chaingraph-trpc/client/
COPY --from=builder --chown=nodeuser:nodejs /app/packages/chaingraph-trpc/server/ ./packages/chaingraph-trpc/server/

RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    chown -R nodeuser:nodejs /app

USER nodeuser

ENV NODE_ENV=${NODE_ENV}
EXPOSE ${PORT}

CMD ["node", "apps/chaingraph-backend/dist/index.cjs"]
FROM node:22.12.0-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.5.2 turbo@2.5.0

# First stage: Prune the monorepo
FROM base AS pruner

COPY . .
RUN turbo prune "@badaitech/chaingraph-frontend" --docker

# Second stage: Install dependencies and build
FROM base AS builder

ARG NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=8192"

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@badaitech/chaingraph-frontend...

# Final stage: Run the application
FROM base AS runner

ARG NODE_ENV=production
ARG PORT=3000
ARG SERVE_VERSION=14.2.4

WORKDIR /app

RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodeuser

# Install serve to run the static site
RUN npm install -g serve@${SERVE_VERSION}

COPY --from=builder --chown=nodeuser:nodejs /app/apps/chaingraph-frontend/dist/ ./dist/

USER nodeuser

ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["serve", "-s", "dist", "-l", "3000"]
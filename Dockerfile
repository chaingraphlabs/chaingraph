FROM node:22.14.0-alpine AS base

ARG GITHUB_TOKEN=""
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.3.0 turbo@2.5.0

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
ENV NODE_OPTIONS="--max-old-space-size=12288"
ENV NODE_ENV=production

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm deploy --filter @badaitech/chaingraph-backend --prod --legacy /prod/backend
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm turbo run build --filter=@badaitech/chaingraph-frontend

FROM base AS backend
WORKDIR /prod/backend
COPY --from=build --chown=node:node /prod/backend /prod/backend
EXPOSE 3001
ENV PORT=3001
USER node
CMD [ "node", "./dist/index.cjs" ]

FROM nginx:alpine AS frontend
WORKDIR /usr/share/nginx/html
COPY --from=build /usr/src/app/apps/chaingraph-frontend/dist/app /usr/share/nginx/html
COPY --from=build /usr/src/app/apps/chaingraph-frontend/dist/lib/* /usr/share/nginx/html/assets
EXPOSE 3001

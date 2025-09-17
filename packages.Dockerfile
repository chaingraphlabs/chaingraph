# Base packages builder - builds only workspace packages (not apps)
FROM node:22.14.0-alpine AS base

WORKDIR /app

# Install pnpm and turbo
RUN npm install -g pnpm@10.5.2 turbo@2.5.0

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ ca-certificates

# Create .npmrc for GitHub packages authentication
RUN echo "@badaitech:registry=https://npm.pkg.github.com" > .npmrc

# Install dependencies for packages only
FROM base AS dependencies

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./

COPY apps/ ./apps/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

# Build stage for packages
FROM dependencies AS builder

ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV NODE_ENV=production

# Build all workspace packages
RUN pnpm turbo run build --filter="./packages/*"

# Final stage: Package built artifacts
FROM base AS packages

WORKDIR /packages

# Copy built packages with their dist directories and node_modules
COPY --from=builder /app/packages/ ./

# Create a marker file to indicate packages are built
RUN echo "Packages built at $(date)" > /packages/.build-info

# Set up environment for consuming images
ENV PACKAGES_ROOT=/packages
# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN pnpm build

# Runtime stage
FROM node:20-alpine

# Install nginx, PM2, and bash
RUN apk add --no-cache nginx bash \
    && npm install -g pm2 pnpm

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy configuration files
COPY ecosystem.config.js ./
COPY nginx/nginx.template.conf /etc/nginx/
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Create necessary directories
RUN mkdir -p /var/log/pm2 /var/log/nginx /run/nginx

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production \
    INSTANCES=4 \
    PORT=4021

# Expose nginx port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/nginx-health || exit 1

# Start the application
ENTRYPOINT ["/docker-entrypoint.sh"]
FROM node:24.11.1-alpine

WORKDIR /app

# Install global dependencies
RUN npm install drizzle-kit dotenv drizzle-orm pg drizzle-kit

# Create minimal directory structure
RUN mkdir -p /app/packages/chaingraph-trpc/server/stores/postgres

# Copy only necessary files for migration
COPY packages/chaingraph-trpc/server/drizzle.config.ts /app/packages/chaingraph-trpc/server/
COPY packages/chaingraph-trpc/server/stores/postgres/schema.ts /app/packages/chaingraph-trpc/server/stores/postgres/

# Set up environment
ENV DATABASE_URL=""

# Run migrations via entrypoint script
CMD ["npx", "drizzle-kit", "push", "--config", "/app/packages/chaingraph-trpc/server/drizzle.config.ts"]

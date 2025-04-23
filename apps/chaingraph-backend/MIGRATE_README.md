# Chaingraph Database Migration Docker Image

This document provides instructions for building and using the Chaingraph database migration Docker image to safely apply schema changes to your database.

## Overview

The migration Docker image is specifically designed to run database migrations for the Chaingraph application. It uses Drizzle Kit to apply schema changes defined in the codebase to your PostgreSQL database. This approach ensures consistent database schema updates across different environments.

### How The Migration Image Works

The Dockerfile is designed with simplicity and reliability in mind:

1. It copies only the necessary files needed for database migrations:
   - The drizzle configuration file
   - The database schema definition file

2. It installs all required dependencies globally:
   - `drizzle-kit`: For running the migrations
   - `drizzle-orm`: The ORM library that drizzle-kit depends on
   - `dotenv`: For environment variable handling
   - `pg`: PostgreSQL client for Node.js

3. It executes the migration command directly using CMD

## Using Makefile Commands

We've added convenient Makefile commands to simplify the process of building and running migrations.

### Building the Migration Image

To build the migration Docker image:

```bash
make db-migrate-build
```

### Running Database Migrations

To run migrations with the built Docker image:

```bash
make db-migrate-run DATABASE_URL="postgres://username:password@hostname:5432/dbname?sslmode=require"
```

### Combined Build and Run

To build the image and immediately run migrations:

```bash
make db-migrate DATABASE_URL="postgres://username:password@hostname:5432/dbname?sslmode=require"
```

## Manual Docker Commands

If you prefer to use Docker commands directly:

### Building the Migration Image

```bash
docker build -t badaitech/chaingraph-migration -f apps/chaingraph-backend/migrate.Dockerfile .
```

### Running Database Migrations

```bash
docker run --rm -e DATABASE_URL="postgres://username:password@hostname:5432/dbname?sslmode=require" badaitech/chaingraph-migration
```

## Security Best Practices

### Using Environment Variables

Always use environment variables for passing database credentials rather than hardcoding them:

```bash
# Store the connection string in an environment variable
export CHAINGRAPH_DB_URL="postgres://username:password@hostname:5432/dbname?sslmode=require"

# Then use it when running the migration
docker run --rm -e DATABASE_URL="$CHAINGRAPH_DB_URL" badaitech/chaingraph-migration
```

### Using Docker Secrets for CI/CD

When running in CI/CD environments, use your platform's secret management system:

```yaml
# Example GitHub Actions workflow using secrets
steps:
  - name: Run database migrations
    run: |
      docker run --rm -e DATABASE_URL=${{ secrets.DATABASE_URL }} badaitech/chaingraph-migration
```

### Using .env Files (Development Only)

For local development, you can use a .env file (but never commit this to version control):

```bash
docker run --rm --env-file .env badaitech/chaingraph-migration
```

## Database URL Format

The PostgreSQL connection string follows this format:

```
postgres://[username]:[password]@[hostname]:[port]/[database_name]?sslmode=[mode]
```

Where:
- `username`: Database user
- `password`: Database password
- `hostname`: Database server hostname or IP
- `port`: Database server port (typically 5432)
- `database_name`: Name of the database
- `sslmode`: SSL connection mode (typically `require` for production, `disable` for development)

## SSL Mode Options

For production deployments, use one of these secure SSL modes:
- `require`: Requires SSL connection
- `verify-ca`: Verifies that the server certificate is signed by a trusted CA
- `verify-full`: Verifies that the server certificate is signed by a trusted CA and the server hostname matches the certificate

For development or testing environments:
- `prefer`: Uses SSL if available, falls back to non-SSL
- `disable`: Does not use SSL (not recommended for production)


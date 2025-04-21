# @badaitech/chaingraph-backend

![License](https://img.shields.io/badge/license-BUSL-blue.svg)

The backend server component for ChainGraph - a flow-based programming framework. This package provides the WebSocket server implementation that powers real-time communication between clients and the ChainGraph execution engine.

## Overview

`@badaitech/chaingraph-backend` delivers:

- **WebSocket Server**: Real-time communication server using WebSockets
- **tRPC Integration**: End-to-end type-safe API implementation
- **Execution Engine**: Hosts the flow execution infrastructure
- **Polyfill Support**: Ensures compatibility across different environments
- **Node Registry**: Manages available computational nodes
- **Data Persistence**: Supports both in-memory and PostgreSQL storage options

This backend server acts as the central hub for ChainGraph, enabling flow creation, execution, debugging, and real-time event propagation between clients and the computational engine.

## Installation

```bash
# Before installing, make sure you have set up authentication for GitHub Packages
npm install @badaitech/chaingraph-backend
# or
yarn add @badaitech/chaingraph-backend
# or
pnpm add @badaitech/chaingraph-backend
```

## Authentication for GitHub Packages

To use this package, you need to configure npm to authenticate with GitHub Packages:

1. Create a personal access token (PAT) with the `read:packages` scope on GitHub.
2. Add the following to your project's `.npmrc` file or to your global `~/.npmrc` file:

```
@badaitech:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Replace `YOUR_GITHUB_PAT` with your actual GitHub personal access token.

## Usage

### Starting the Server

The simplest way to start the server:

```typescript
import { init } from '@badaitech/chaingraph-trpc/server'
import { wsServer } from '@badaitech/chaingraph-backend'

// Initialize the tRPC context and stores
await init()

// Start the WebSocket server
wsServer()
```

### Environment Variables

ChainGraph Backend can be configured through environment variables. You can set these in a `.env` file in the project root or provide them directly when running the server.

#### Server Configuration

| Variable           | Description                      | Default     | Example   |
| ------------------ | -------------------------------- | ----------- | --------- |
| `TRPC_SERVER_HOST` | Host address for the tRPC server | `localhost` | `0.0.0.0` |
| `TRPC_SERVER_PORT` | Port for the tRPC server         | `3001`      | `4000`    |

#### Keep-Alive Settings

| Variable                              | Description                             | Default | Example |
| ------------------------------------- | --------------------------------------- | ------- | ------- |
| `TRPC_SERVER_KEEP_ALIVE_ENABLED`      | Enable/disable WebSocket keep-alive     | `true`  | `false` |
| `TRPC_SERVER_KEEP_ALIVE_PING_MS`      | Interval for sending ping messages (ms) | `5000`  | `10000` |
| `TRPC_SERVER_KEEP_ALIVE_PONG_WAIT_MS` | Timeout for awaiting pong response (ms) | `10000` | `20000` |

#### Database Configuration

| Variable       | Description                  | Default                                                       | Example                                                     |
| -------------- | ---------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres@localhost:5431/postgres?sslmode=disable` | `postgres://user:password@host:5432/dbname?sslmode=require` |

#### Authentication Settings

| Variable             | Description                                | Default                         | Example                         |
| -------------------- | ------------------------------------------ | ------------------------------- | ------------------------------- |
| `AUTH_ENABLED`       | Enable/disable authentication              | `false`                         | `true`                          |
| `AUTH_DEV_MODE`      | Enable development mode for authentication | `false`                         | `true`                          |
| `BADAI_AUTH_ENABLED` | Enable BadAI authentication                | `false`                         | `true`                          |
| `BADAI_API_URL`      | URL for the BadAI GraphQL API              | `http://localhost:9151/graphql` | `https://api.badai.com/graphql` |

#### Example .env Files

**Basic Configuration:**
```env
# Basic server setup
TRPC_SERVER_HOST=localhost
TRPC_SERVER_PORT=3001
DATABASE_URL=postgres://postgres:postgres@localhost:5432/chaingraph
```

**Production Configuration:**
```env
# Production setup with authentication
TRPC_SERVER_HOST=0.0.0.0
TRPC_SERVER_PORT=3001
TRPC_SERVER_KEEP_ALIVE_ENABLED=true
TRPC_SERVER_KEEP_ALIVE_PING_MS=5000
TRPC_SERVER_KEEP_ALIVE_PONG_WAIT_MS=10000
DATABASE_URL=postgres://user:password@prod-db:5432/chaingraph?sslmode=require
AUTH_ENABLED=true
BADAI_AUTH_ENABLED=true
BADAI_API_URL=https://api.badai.com/graphql
```

**Development Configuration:**
```env
# Development setup
TRPC_SERVER_HOST=localhost
TRPC_SERVER_PORT=3001
DATABASE_URL=postgres://postgres@localhost:5431/postgres?sslmode=disable
AUTH_ENABLED=true
AUTH_DEV_MODE=true
```

### Running with Docker

```bash
# Build the Docker image
docker build -t chaingraph-backend -f packages/chaingraph-backend/Dockerfile .

# Run the container
docker run -p 3001:3001 -e DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/chaingraph chaingraph-backend
```

## Server Features

### WebSocket Communication

The backend creates a WebSocket server that handles:

- **tRPC Procedures**: Type-safe API calls from clients
- **Real-time Subscriptions**: Event streaming for flow execution
- **Connection Management**: Tracking active connections and graceful shutdown

```typescript
// The WebSocket server is initialized with:
const wss = new WebSocketServer({
  port: 3001,
})

// tRPC handler is applied to provide type-safe communication
const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
})
```

### Text Encoder/Decoder Stream Polyfills

The package includes polyfills for `TextEncoderStream` and `TextDecoderStream` to ensure compatibility across different Node.js environments:

```typescript
// Apply polyfills when needed
import { setupPolyfills } from '@badaitech/chaingraph-backend'

setupPolyfills()
```

## Development

To run the backend in development mode with hot reloading:

```bash
# Clone the repository
git clone https://github.com/badaitech/chaingraph.git
cd chaingraph

# Install dependencies
pnpm install

# Start the backend in development mode
pnpm --filter @badaitech/chaingraph-backend run dev
```

### Building for Production

```bash
# Build the package
pnpm --filter @badaitech/chaingraph-backend run build

# Start the production server
pnpm --filter @badaitech/chaingraph-backend run start
```

### Testing

```bash
# Run tests
pnpm --filter @badaitech/chaingraph-backend run test

# Run tests with coverage
pnpm --filter @badaitech/chaingraph-backend run test:coverage
```

## API Documentation

This package primarily serves as an infrastructure component, with most user-facing APIs being provided through the `@badaitech/chaingraph-trpc` package. Key exports include:

- **wsServer()**: Function to initialize and start the WebSocket server
- **setupPolyfills()**: Function to apply necessary polyfills for streaming functionality

## License

BUSL-1.1 - Business Source License

## Related Packages

- **@badaitech/chaingraph-types**: Core type definitions and decorators
- **@badaitech/chaingraph-frontend**: Frontend components for visual flow programming
- **@badaitech/chaingraph-trpc**: tRPC API layer for type-safe communication
- **@badaitech/chaingraph-nodes**: Collection of pre-built nodes

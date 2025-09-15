# ChainGraph tRPC Server

A scalable WebSocket-based tRPC server for ChainGraph that directly uses the executor's WebSocket server implementation.

## Architecture

This server is a thin deployment wrapper around the ChainGraph executor's WebSocket server. It can be scaled horizontally using PM2 for process management and nginx for load balancing, all within a single Docker container.

```
┌─────────────────────────────────────────┐
│           Docker Container              │
├─────────────────────────────────────────┤
│                nginx                    │
│         (Port 80 - Public)              │
│              ↓     ↓     ↓              │
├─────────────────────────────────────────┤
│     PM2 Cluster Mode Manager            │
│    ┌──────┐ ┌──────┐ ┌──────┐         │
│    │ App  │ │ App  │ │ App  │   ...   │
│    │:3000 │ │:3001 │ │:3002 │         │
│    └──────┘ └──────┘ └──────┘         │
└─────────────────────────────────────────┘
```

## Features

- **Pure WebSocket**: All tRPC procedures run over WebSocket connections
- **Zero Duplication**: Directly reuses executor's WebSocket server implementation
- **Dynamic Scaling**: Configure the number of instances via environment variable
- **Load Balancing**: nginx distributes WebSocket connections across PM2 instances with IP-hash sticky sessions
- **Process Management**: PM2 handles crashes, restarts, and monitoring
- **Production Ready**: Optimized for production deployments

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build the project
pnpm build

# Run in production mode
pnpm start
```

### Docker Deployment

```bash
# Build the Docker image
docker build -t chaingraph-trpc-server .

# Run with default settings (4 instances)
docker run -p 8080:80 \
  -e DATABASE_URL="postgres://user:pass@host:5432/db" \
  -e KAFKA_BROKERS="kafka:9092" \
  chaingraph-trpc-server

# Run with custom number of instances
docker run -p 8080:80 \
  -e INSTANCES=8 \
  -e DATABASE_URL="postgres://user:pass@host:5432/db" \
  -e KAFKA_BROKERS="kafka:9092" \
  chaingraph-trpc-server
```

### Docker Compose

```bash
# Start with docker-compose
docker-compose up -d

# Scale instances (edit INSTANCES in .env or docker-compose.yml)
INSTANCES=8 docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Configuration

### Environment Variables

| Variable        | Description                                      | Default                                           |
|-----------------|--------------------------------------------------|---------------------------------------------------|
| `INSTANCES`     | Number of PM2 instances to run                  | `4`                                               |
| `PORT`          | Base port for internal servers (auto-incremented)| `4021`                                            |
| `DATABASE_URL`  | PostgreSQL connection string                    | `postgres://postgres@localhost:5432/chaingraph`  |
| `KAFKA_BROKERS` | Comma-separated list of Kafka brokers           | `localhost:9092`                                  |
| `LOG_LEVEL`     | Logging level                                    | `info`                                            |
| `NODE_ENV`      | Node environment                                 | `production`                                      |

### PM2 Configuration

The PM2 configuration is in `ecosystem.config.js`. Key settings:

- **Cluster Mode**: Automatically enabled for load balancing
- **Memory Limit**: Auto-restart at 1GB memory usage
- **Max Restarts**: 10 restarts before stopping
- **Logs**: Merged and timestamped in `/var/log/pm2/`

### nginx Configuration

The nginx configuration template is in `nginx/nginx.template.conf`. Features:

- **IP Hash**: Sticky sessions for WebSocket connections
- **Health Checks**: Built-in health endpoints
- **Gzip**: Compression enabled for better performance
- **WebSocket**: Full upgrade support with long timeouts

## Monitoring

### Health Checks

- **nginx Health**: `http://localhost/nginx-health`
- **Application Health**: `http://localhost/health`
- **PM2 Status**: Inside container: `pm2 status`

### Logs

Inside the Docker container:
```bash
# PM2 logs
pm2 logs

# nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

From Docker:
```bash
docker logs <container-id>
```

### PM2 Monitoring

```bash
# Enter the container
docker exec -it <container-id> sh

# View PM2 status
pm2 status

# View real-time monitoring
pm2 monit

# View specific instance logs
pm2 logs 0
```

## Scaling Strategies

### Vertical Scaling (Single Host)

Increase the number of instances:
```bash
INSTANCES=16 docker-compose up -d
```

### Horizontal Scaling (Multiple Hosts)

Deploy multiple containers behind a load balancer:

```nginx
# External Load Balancer Configuration
upstream trpc_servers {
    server host1:8080;
    server host2:8080;
    server host3:8080;
}
```

### Multi-Layer Architecture

For large-scale deployments:

```
        Internet
           ↓
    [CDN / CloudFlare]
           ↓
    [Layer 1: Global LB]
         ↙   ↘
   [Regional LB] [Regional LB]
      ↙  ↘         ↙  ↘
  [Server] [Server] [Server]
```

## Production Deployment

### Recommended Settings

```yaml
# docker-compose.prod.yml
services:
  trpc-server:
    image: chaingraph-trpc-server:latest
    environment:
      - INSTANCES=8  # Adjust based on CPU cores
      - NODE_ENV=production
      - LOG_LEVEL=warn
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
    restart: always
```

### Security Considerations

1. **Use HTTPS**: Put behind a reverse proxy with SSL
2. **Firewall**: Only expose port 80/443
3. **Secrets**: Use Docker secrets for sensitive data
4. **Updates**: Regularly update base images

### Performance Tuning

1. **Instance Count**: Set to 1.5-2x CPU cores
2. **Memory**: Monitor and adjust PM2 memory limits
3. **nginx Workers**: Auto-configured based on CPU
4. **Database Pool**: Configure connection pooling

## Troubleshooting

### Common Issues

**High Memory Usage**
```bash
# Adjust PM2 memory limit in ecosystem.config.js
max_memory_restart: '500M'  # Lower limit
```

**WebSocket Connection Issues**
```bash
# Check nginx timeout settings
proxy_read_timeout 7d;  # Already configured
```

**Port Already in Use**
```bash
# Change the external port in docker-compose.yml
ports:
  - "8081:80"  # Use different external port
```

## Development

### Project Structure

```
apps/chaingraph-trpc-server/
├── src/
│   ├── index.ts           # Entry point
│   ├── config.ts          # Configuration
│   ├── logger.ts          # Logging setup
│   └── server/
│       ├── index.ts       # Server initialization
│       ├── context.ts     # tRPC context
│       └── router.ts      # tRPC router
├── nginx/
│   └── nginx.template.conf # nginx configuration
├── ecosystem.config.js     # PM2 configuration
├── Dockerfile             # Docker build
├── docker-entrypoint.sh   # Container startup
└── docker-compose.yml     # Compose configuration
```

### Adding New Features

1. Implement in TypeScript (`src/`)
2. Build: `pnpm build`
3. Test locally: `pnpm dev`
4. Build Docker image: `docker build -t chaingraph-trpc-server .`
5. Test in Docker: `docker run -p 8080:80 chaingraph-trpc-server`

## License

Business Source License 1.1 - See LICENSE.txt for details.
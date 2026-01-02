# Quick Start Guide

## Development (Local with Neon Local)

```powershell
# 1. Setup environment
Copy-Item .env.development .env
# Edit .env with your Neon credentials (NEON_API_KEY, NEON_PROJECT_ID, PARENT_BRANCH_ID)

# 2. Start development environment
docker-compose -f docker-compose.dev.yml up --build

# 3. Access application
# App: http://localhost:3000
# Database: localhost:5432

# 4. Stop development environment
docker-compose -f docker-compose.dev.yml down
```

## Production (Cloud with Neon)

```powershell
# 1. Setup environment
Copy-Item .env.production .env
# Edit .env with your production DATABASE_URL

# 2. Run migrations
npm run db:migrate

# 3. Start production environment
docker-compose -f docker-compose.prod.yml up --build -d

# 4. Check logs
docker logs acquisitions-app-prod -f

# 5. Stop production environment
docker-compose -f docker-compose.prod.yml down
```

## Useful Commands

```powershell
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs
docker logs <container-name> -f

# Execute command in running container
docker exec -it acquisitions-app-dev sh

# Rebuild without cache
docker-compose -f docker-compose.dev.yml build --no-cache

# Clean up everything
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a
```

## Environment Comparison

| Feature    | Development            | Production          |
| ---------- | ---------------------- | ------------------- |
| Database   | Neon Local (Ephemeral) | Neon Cloud          |
| Branch     | Auto-created & deleted | Persistent          |
| Hot Reload | ✅ Enabled             | ❌ Disabled         |
| Logging    | Debug                  | Info/Warn           |
| SSL        | Self-signed cert       | Valid cert          |
| Port       | 3000 (configurable)    | 3000 (configurable) |

## Troubleshooting

**Connection issues?**

- Check `docker ps` for container health
- Verify environment variables in `.env`
- Check logs: `docker logs <container-name>`

**Port conflicts?**

- Find process: `netstat -ano | findstr :3000`
- Change port in docker-compose.yml

**Need fresh start?**

```powershell
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

For detailed documentation, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)

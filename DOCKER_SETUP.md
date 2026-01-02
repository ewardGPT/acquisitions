# Docker Setup with Neon Database

This guide explains how to run the Acquisitions application using Docker with Neon Database in both development and production environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Development Setup (Neon Local)](#development-setup-neon-local)
- [Production Setup (Neon Cloud)](#production-setup-neon-cloud)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)

## Overview

The application uses different database configurations for development and production:

- **Development**: Uses **Neon Local** via Docker, which creates ephemeral database branches automatically
- **Production**: Connects directly to **Neon Cloud** database using a serverless connection

## Prerequisites

1. **Docker Desktop** (for Windows) - [Download here](https://www.docker.com/products/docker-desktop/)
2. **Neon Account** - [Sign up here](https://console.neon.tech/signup)
3. **Neon API Key** - Generate from [Neon Console → Account Settings → API Keys](https://console.neon.tech/app/settings/api-keys)

## Development Setup (Neon Local)

### Step 1: Configure Environment Variables

1. Copy the development environment template:

   ```powershell
   Copy-Item .env.development .env
   ```

2. Edit `.env` and add your Neon credentials:

   ```env
   NEON_API_KEY=your_actual_neon_api_key
   NEON_PROJECT_ID=your_neon_project_id
   PARENT_BRANCH_ID=your_main_branch_id
   ```

   **Where to find these values:**
   - Log in to [Neon Console](https://console.neon.tech)
   - Select your project
   - **Project ID**: Found in the URL or Project Settings
   - **Parent Branch ID**: Go to Branches tab, copy the ID of your main branch
   - **API Key**: Account Settings → API Keys → Create New

### Step 2: Start the Development Environment

Run the application with Neon Local:

```powershell
docker-compose -f docker-compose.dev.yml up --build
```

**What happens:**

1. Neon Local container starts and creates an ephemeral database branch
2. Application container starts and connects to Neon Local at `neon-local:5432`
3. Your app is now running at `http://localhost:3000`

### Step 3: Verify the Setup

Check that both containers are running:

```powershell
docker ps
```

You should see:

- `neon-local-dev` (Neon Local proxy)
- `acquisitions-app-dev` (Your application)

### Step 4: Stop the Development Environment

```powershell
docker-compose -f docker-compose.dev.yml down
```

**Important**: When you stop the containers, the ephemeral database branch is automatically deleted. This ensures you always start fresh.

### Development Features

- **Hot Reloading**: Source code is mounted as a volume, so changes are reflected immediately
- **Fresh Database**: Each `docker-compose up` creates a new database branch
- **Isolated Testing**: Each developer can run their own isolated database branch
- **Debug Logging**: Set to debug level by default

## Production Setup (Neon Cloud)

### Step 1: Get Your Production Database URL

1. Log in to [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to **Dashboard** → **Connection Details**
4. Copy the connection string (should look like):
   ```
   postgres://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Step 2: Configure Production Environment

1. Copy the production environment template:

   ```powershell
   Copy-Item .env.production .env
   ```

2. Edit `.env` and set your production database URL:
   ```env
   NODE_ENV=production
   PORT=3000
   LOG_LEVEL=info
   DATABASE_URL=postgres://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Step 3: Run Database Migrations

Before starting the production app, run migrations:

```powershell
# Generate migrations (if needed)
npm run db:generate

# Apply migrations to production database
npm run db:migrate
```

### Step 4: Start the Production Environment

```powershell
docker-compose -f docker-compose.prod.yml up --build -d
```

The `-d` flag runs containers in detached mode (background).

### Step 5: Verify Production Deployment

Check container status:

```powershell
docker ps
```

Check logs:

```powershell
docker logs acquisitions-app-prod -f
```

### Step 6: Stop Production Environment

```powershell
docker-compose -f docker-compose.prod.yml down
```

## Database Migrations

### Running Migrations in Development

```powershell
# Start only the Neon Local container
docker-compose -f docker-compose.dev.yml up neon-local -d

# Run migrations locally
npm run db:migrate

# Or run migrations inside the app container
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### Running Migrations in Production

Always test migrations in development first!

```powershell
# Set production database URL
$env:DATABASE_URL="your_production_database_url"

# Generate migration files
npm run db:generate

# Review migration files in ./drizzle directory

# Apply to production
npm run db:migrate
```

## Environment Variables Reference

### Development (.env.development)

| Variable           | Description                              | Example                                                     |
| ------------------ | ---------------------------------------- | ----------------------------------------------------------- |
| `NODE_ENV`         | Environment mode                         | `development`                                               |
| `PORT`             | Application port                         | `3000`                                                      |
| `LOG_LEVEL`        | Logging verbosity                        | `debug`                                                     |
| `NEON_API_KEY`     | Neon API key                             | `your_api_key`                                              |
| `NEON_PROJECT_ID`  | Neon project ID                          | `proud-wind-12345`                                          |
| `PARENT_BRANCH_ID` | Branch to fork from                      | `br-wispy-meadow-67890`                                     |
| `DATABASE_URL`     | Local connection (overridden by compose) | `postgres://neon:npg@localhost:5432/neondb?sslmode=require` |

### Production (.env.production)

| Variable       | Description                  | Example                                                    |
| -------------- | ---------------------------- | ---------------------------------------------------------- |
| `NODE_ENV`     | Environment mode             | `production`                                               |
| `PORT`         | Application port             | `3000`                                                     |
| `LOG_LEVEL`    | Logging verbosity            | `info` or `warn`                                           |
| `DATABASE_URL` | Neon Cloud connection string | `postgres://user:pass@ep-xxx.neon.tech/db?sslmode=require` |

## Troubleshooting

### Neon Local Container Fails to Start

**Problem**: `neon-local` container exits immediately

**Solution**:

- Verify your `NEON_API_KEY` is correct
- Verify your `NEON_PROJECT_ID` exists
- Verify your `PARENT_BRANCH_ID` is valid
- Check logs: `docker logs neon-local-dev`

### App Cannot Connect to Database

**Problem**: Connection refused errors

**Solution**:

- Ensure Neon Local is healthy: `docker ps` (should show "healthy")
- Check DATABASE_URL format includes `?sslmode=require`
- Verify network connectivity: `docker network inspect acquisitions_app-network`

### Port Already in Use

**Problem**: `port 3000 or 5432 is already allocated`

**Solution**:

```powershell
# Find what's using the port
netstat -ano | findstr :3000

# Change port in docker-compose file or stop the conflicting service
```

### Self-Signed Certificate Errors (JavaScript)

**Problem**: SSL certificate errors when using `pg` or `postgres` libraries

**Solution**: Add SSL configuration to your database connection code:

```javascript path=null start=null
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon Local self-signed cert
  },
});
```

### Fresh Start (Clean Everything)

```powershell
# Stop all containers
docker-compose -f docker-compose.dev.yml down -v

# Remove images
docker rmi acquisitions-app-dev neondatabase/neon_local:latest

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml up --build
```

## Best Practices

### Development

- Always use ephemeral branches (set `PARENT_BRANCH_ID`, not `BRANCH_ID`)
- Commit `.env.example` but never `.env` or `.env.development`
- Use volume mounts for fast iteration
- Keep development database small and test data minimal

### Production

- Never expose `DATABASE_URL` in logs or error messages
- Use secrets management in production (AWS Secrets Manager, Azure Key Vault, etc.)
- Always run migrations before deploying new code
- Test migrations on a staging branch first
- Monitor database connection pool usage
- Set appropriate `LOG_LEVEL` (info or warn, not debug)

## Additional Resources

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Neon Branching Guide](https://neon.com/docs/guides/branching)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## CI/CD Integration

For automated deployments, use environment variables:

```yaml
# Example GitHub Actions workflow
env:
  DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
  NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
```

Never hardcode credentials in your compose files or Dockerfiles!

# Migration Guide: Switching to Dockerized Setup

This guide helps you migrate from your current setup to the Dockerized Neon setup.

## Current State vs New State

### Before (Current)
- Database connection: Direct to Neon Cloud
- Configuration: `src/config/database.js`
- No Docker containers
- Manual environment management

### After (New)
- Development: Neon Local via Docker (ephemeral branches)
- Production: Neon Cloud (unchanged)
- Configuration: `src/config/database.config.js` (environment-aware)
- Dockerized application
- Automated environment switching

## Migration Steps

### Step 1: Update Database Configuration (Optional but Recommended)

The new `database.config.js` file provides better support for Neon Local in development. You have two options:

#### Option A: Replace the existing file (Recommended)

```powershell
# Backup existing config
Copy-Item src/config/database.js src/config/database.js.backup

# The new file is already created at src/config/database.config.js
# If you want to use it as the main config:
Move-Item src/config/database.config.js src/config/database.js -Force
```

#### Option B: Keep using your existing database.js

Your current `database.js` will work with the Docker setup, but Neon Local may not function optimally with the serverless driver. To use Neon Local properly, add this configuration at the top of your `database.js`:

```javascript path=null start=null
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Add this configuration
if (process.env.NODE_ENV === 'development') {
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
  neonConfig.useSecureWebSocket = false;
  neonConfig.wsProxy = () => null;
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export { db, sql };
```

### Step 2: Setup Environment Files

```powershell
# Copy development template
Copy-Item .env.development .env

# Edit .env and add your Neon credentials
# Required values:
#   - NEON_API_KEY
#   - NEON_PROJECT_ID  
#   - PARENT_BRANCH_ID
```

**Where to get these values:**
1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. **API Key**: Account Settings → API Keys → Create New API Key
4. **Project ID**: Found in Project Settings or the URL
5. **Parent Branch ID**: Branches tab → Your main branch → Copy ID

### Step 3: Test Development Setup

```powershell
# Start Docker development environment
docker-compose -f docker-compose.dev.yml up --build

# Verify containers are running
docker ps

# You should see:
# - neon-local-dev (status: healthy)
# - acquisitions-app-dev (status: up)

# Test the application
# Open browser: http://localhost:3000
```

### Step 4: Verify Database Connection

Check the logs to ensure database connection is successful:

```powershell
# View app logs
docker logs acquisitions-app-dev -f

# You should see:
# "🔧 Database configured for Neon Local (Development)"
# "Listening on port http://localhost:3000"
```

### Step 5: Run Existing Migrations

If you have existing database migrations:

```powershell
# Option 1: Run migrations from your host machine
npm run db:migrate

# Option 2: Run migrations inside the container
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### Step 6: Production Setup

When ready for production:

```powershell
# Copy production template
Copy-Item .env.production .env

# Edit .env with your production Neon Cloud URL
# DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/db?sslmode=require

# Run migrations on production database
npm run db:migrate

# Start production containers
docker-compose -f docker-compose.prod.yml up --build -d
```

## Rollback Plan

If you need to rollback to your previous setup:

```powershell
# Stop all Docker containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.prod.yml down

# Restore original database config (if you backed it up)
Move-Item src/config/database.js.backup src/config/database.js -Force

# Use your original .env file
# Continue running: npm run dev
```

## Key Differences to Note

### Database URLs

**Development (Old):**
```env
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/db?sslmode=require
```

**Development (New - Docker):**
```env
# In docker-compose.dev.yml, automatically set to:
DATABASE_URL=postgres://neon:npg@neon-local:5432/neondb?sslmode=require
```

**Production (Both):**
```env
DATABASE_URL=postgres://user:pass@ep-xxx.neon.tech/db?sslmode=require
```

### Running the Application

**Old way:**
```powershell
npm run dev
```

**New way (Docker):**
```powershell
docker-compose -f docker-compose.dev.yml up
```

**New way (Non-Docker - still works):**
```powershell
npm run dev
# (Will connect directly to Neon Cloud using DATABASE_URL from .env)
```

## Benefits of the New Setup

✅ **Ephemeral Branches**: Each dev session gets a fresh database branch  
✅ **Team Isolation**: Each developer can run their own database branch  
✅ **No Manual Cleanup**: Database branches are automatically deleted when containers stop  
✅ **Production Parity**: Same Dockerfile for dev and prod, only environment differs  
✅ **Easy Onboarding**: New developers just need to run `docker-compose up`  
✅ **Branch-based Development**: Test migrations and schema changes safely  

## Frequently Asked Questions

### Q: Can I still use `npm run dev` without Docker?

**A:** Yes! The application works both ways:
- With Docker: Uses Neon Local (ephemeral branches)
- Without Docker: Uses direct Neon Cloud connection (your DATABASE_URL)

### Q: Will this change my production database?

**A:** No. Production continues to use your existing Neon Cloud database. The Dockerized setup only adds Neon Local for development.

### Q: What if I don't want to use Docker for development?

**A:** You can continue using `npm run dev` as before. The Docker setup is optional but recommended for the benefits mentioned above.

### Q: Do I need to change my application code?

**A:** No code changes required. Only configuration changes to support environment-aware database connections.

### Q: How do I switch between dev and prod?

**A:** Use different docker-compose files:
- Development: `docker-compose -f docker-compose.dev.yml up`
- Production: `docker-compose -f docker-compose.prod.yml up`

### Q: What about my existing data?

**A:** 
- Development: Neon Local creates new ephemeral branches (fresh data each time)
- Production: Your production data is unchanged
- If you need production data in dev, use Neon's branching feature to create a data-seeded branch

## Troubleshooting Migration Issues

### Issue: "Cannot connect to database"

**Solution:**
1. Check if Neon Local is healthy: `docker ps`
2. Verify environment variables: `docker logs neon-local-dev`
3. Ensure DATABASE_URL format is correct in docker-compose.dev.yml

### Issue: "Migrations not applying"

**Solution:**
```powershell
# Ensure Neon Local is running
docker-compose -f docker-compose.dev.yml up neon-local -d

# Wait for it to be healthy (about 10 seconds)
Start-Sleep -Seconds 10

# Run migrations
npm run db:migrate
```

### Issue: "Port 5432 already in use"

**Solution:**
```powershell
# Find what's using port 5432
netstat -ano | findstr :5432

# Stop local PostgreSQL if running
# Or change the port in docker-compose.dev.yml:
#   ports:
#     - '5433:5432'
```

## Next Steps

1. ✅ Complete this migration
2. 📖 Read [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed documentation
3. 🚀 Check [QUICK_START.md](./QUICK_START.md) for common commands
4. 🧪 Test your application with ephemeral branches
5. 🎉 Enjoy streamlined development workflow!

## Need Help?

- Detailed docs: [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- Quick reference: [QUICK_START.md](./QUICK_START.md)
- Neon docs: https://neon.com/docs/local/neon-local
- Docker docs: https://docs.docker.com/compose/

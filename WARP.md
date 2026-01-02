# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Running the Application
- `npm run dev` - Start development server with auto-reload (using Node's --watch flag)
- Server runs on port 3000 by default (configurable via PORT env var)

### Code Quality
- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without modifying

### Database Operations
- `npm run db:generate` - Generate Drizzle migrations from schema changes in src/models
- `npm run db:migrate` - Apply pending migrations to database
- `npm run db:studio` - Open Drizzle Studio for database management

## Architecture

This is a Node.js Express REST API with PostgreSQL (Neon) database using Drizzle ORM.

### Key Architectural Patterns

**Request Flow**: Route → Controller → Service → Database
- Routes (`src/routes/`) define HTTP endpoints and wire up controllers
- Controllers (`src/controllers/`) handle request/response, validate with Zod schemas
- Services (`src/services/`) contain business logic and database interactions
- Models (`src/models/`) define Drizzle ORM schemas

**Authentication Pattern**: JWT tokens stored in httpOnly cookies
- JWT utility in `src/utils/jwt.js` signs/verifies tokens with JWT_SECRET
- Cookie utility in `src/utils/cookies.js` manages secure cookie settings (httpOnly, sameSite:strict)
- Passwords hashed with bcrypt (10 rounds) before storage

**Database Connection**: Neon serverless PostgreSQL via Drizzle ORM
- Connection configured in `src/config/database.js` using DATABASE_URL
- Uses Drizzle's HTTP adapter (`drizzle-orm/neon-http`)
- Schema changes require running `npm run db:generate` then `npm run db:migrate`

**Import Aliases**: The project uses `#` prefix for cleaner imports
```
#config/*  src/config/*
#middleware/*  src/middleware/*
#routes/*  src/routes/*
#utils/*  src/utils/*
#services/*  src/services/*
#models/*  src/models/*
#controllers/*  src/controllers/*
#validations/*  src/validations/*
```

### Validation
- All input validation uses Zod schemas (in `src/validations/`)
- Use `.safeParse()` in controllers, format errors with `formatValidationError()` from `src/utils/format.js`

### Logging
- Winston logger configured in `src/config/logger.js`
- Logs to files: `error.logs/error.lg` (errors only) and `logs/combined.lg` (all levels)
- Console logging in non-production environments
- Morgan middleware logs HTTP requests via Winston
- Log level controlled by LOG_LEVEL env var (default: 'info')

### Environment Configuration
Required environment variables (see `.env.example`):
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Winston log level (default: info)
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing (required for production)

## Adding New Features

### Creating a New Route/Feature
1. Define Drizzle model in `src/models/` if database table needed
2. Run `npm run db:generate` and `npm run db:migrate` to create table
3. Create Zod validation schema in `src/validations/`
4. Implement business logic in `src/services/`
5. Create controller in `src/controllers/` that uses validation and service
6. Wire up route in `src/routes/` or create new route file
7. Register route in `src/app.js`

### Working with the Database
- Models use Drizzle's pgTable with column definitions
- All database queries use Drizzle query builder (imported from `#config/database.js`)
- Use Drizzle operators from `drizzle-orm` (e.g., `eq`, `and`, `or`)
- Always use `.returning()` on inserts to get created records

## Testing the API
- Health check endpoint: GET `/health`
- API root: GET `/api`
- Auth endpoints under `/api/auth/`: 
  - POST `/api/auth/sign-up` - User registration (implemented)
  - POST `/api/auth/sign-in` - Login (stub only)
  - POST `/api/auth/sign-out` - Logout (stub only)

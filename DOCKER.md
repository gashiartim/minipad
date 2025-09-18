# Docker Setup for Notepad App

This guide explains how to run the Notepad application using Docker and Docker Compose with PostgreSQL.

## Prerequisites

- Docker and Docker Compose installed
- Git (to clone the repository)

## Quick Start

### 1. Production Setup

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### 2. Development Setup

```bash
# Start with development configuration (includes pgAdmin)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### 3. Using npm scripts

```bash
# Build Docker images
npm run docker:build

# Start production environment
npm run docker:up

# Start development environment
npm run docker:dev

# View application logs
npm run docker:logs

# Stop all services
npm run docker:down
```

## Services

### Application (app)

- **Port**: 3000
- **URL**: http://localhost:3000
- **Database**: PostgreSQL (connected automatically)

### PostgreSQL Database (db)

- **Port**: 5432
- **Database**: notepad
- **Username**: postgres
- **Password**: postgres
- **Persistent Storage**: Yes (Docker volume)

### pgAdmin (development only)

- **Port**: 8080
- **URL**: http://localhost:8080
- **Email**: admin@admin.com
- **Password**: admin

## Database Management

### Connect to PostgreSQL directly

```bash
# Connect using Docker
docker-compose exec db psql -U postgres -d notepad

# Or connect from host (if you have psql installed)
psql -h localhost -p 5432 -U postgres -d notepad
```

### Reset Database

```bash
# Stop services
docker-compose down

# Remove database volume
docker volume rm notepad_postgres_data

# Start services again
docker-compose up -d
```

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notepad"
```

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL container is healthy: `docker-compose ps`
2. Check database logs: `docker-compose logs db`
3. Verify network connectivity: `docker-compose exec app ping db`

### Application Not Starting

1. Check application logs: `docker-compose logs app`
2. Verify Prisma client generation: `docker-compose exec app npx prisma generate`
3. Run database migrations: `docker-compose exec app npx prisma migrate deploy`

### Port Conflicts

If ports 3000, 5432, or 8080 are already in use, modify the ports in `docker-compose.yml`:

```yaml
ports:
  - '3001:3000' # Change app port
  - '5433:5432' # Change db port
  - '8081:80' # Change pgAdmin port
```

## Production Deployment

For production deployment on Coolify:

1. Set environment variable:

   ```
   DATABASE_URL=postgresql://username:password@db-host:5432/notepad
   ```

2. Ensure PostgreSQL service is available and accessible

3. The application will automatically run migrations on startup

## Features Included

- ✅ Rich text editor with image support
- ✅ Image upload, resize, copy, and download
- ✅ Real-time collaboration
- ✅ Note sharing with secrets
- ✅ PostgreSQL database with persistence
- ✅ Docker containerization
- ✅ Health checks and restart policies

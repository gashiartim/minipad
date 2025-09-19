# Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- pnpm
- Git

### Setup
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Copy environment file: `cp env.example .env`
4. Generate Prisma client: `pnpm prisma generate`
5. Create database: `pnpm prisma db push`
6. Start development server: `pnpm dev`

The app will be available at `http://localhost:3000`

## Docker Compose (Local Testing)

### Prerequisites
- Docker
- Docker Compose

### Setup
1. Set environment variable: `export POSTGRES_PASSWORD=your_secure_password`
2. Build and start: `docker-compose up --build -d`
3. Check status: `docker-compose ps`
4. View logs: `docker-compose logs app`
5. Stop: `docker-compose down`

The app will be available at `http://localhost:3000`

### Volumes
- `postgres_data`: Database persistence
- `uploaded_images`: Image uploads persistence

## Coolify Deployment

### Prerequisites
- Coolify instance running
- Git repository access
- PostgreSQL service in Coolify

### Setup Steps

1. **Create PostgreSQL Service**
   - In Coolify dashboard, create a new PostgreSQL service
   - Note the connection details
   - Ensure the database name is `notepad`

2. **Create Application**
   - Add new application in Coolify
   - Connect to your Git repository
   - Set build pack to Docker

3. **Environment Variables**
   Set these environment variables in Coolify:
   ```bash
   DATABASE_URL=postgresql://postgres:password@postgres-service:5432/notepad
   NODE_ENV=production
   POSTGRES_PASSWORD=your_secure_password
   ```

4. **Build Configuration**
   - Build command: Docker (automatic)
   - Port: 3000
   - Health check: `/api/health`

5. **Persistent Storage**
   Create a persistent volume for images:
   - Mount path: `/app/data/uploads`
   - This ensures uploaded images persist across deployments

6. **Deploy**
   - Push your changes to the repository
   - Coolify will automatically build and deploy

### Database Migration
The application automatically runs database migrations on startup using the Docker entrypoint script.

### Monitoring
- Health check endpoint: `/api/health`
- Logs are available in Coolify dashboard
- Real-time features use Server-Sent Events

## Configuration Files

### Environment Variables
- **Development**: `.env` (SQLite)
- **Production**: Set in Coolify dashboard (PostgreSQL)

### Key Files
- `Dockerfile`: Multi-stage production build
- `docker-compose.yml`: Local Docker testing
- `scripts/docker-entrypoint.sh`: Production startup script
- `prisma/schema.prisma`: Development schema (SQLite)
- `prisma/schema.prod.prisma`: Production schema (PostgreSQL)

## Features
- Rich text editor with TipTap
- Real-time collaboration via Server-Sent Events
- Image upload and management
- Password-protected notes
- Auto-save functionality
- Mobile-responsive design

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL environment variable
   - Ensure PostgreSQL service is running
   - Verify network connectivity

2. **Images Not Persisting**
   - Ensure volume is mounted to `/app/data/uploads`
   - Check file permissions

3. **Real-time Features Not Working**
   - Check if SSE is supported by your proxy
   - Ensure WebSocket/SSE traffic is not blocked

4. **Build Failures**
   - Check Node.js version (18+ required)
   - Verify all environment variables are set
   - Check Docker build logs

### Health Check
```bash
curl http://your-domain/api/health
# Should return: {"ok":true}
```

### View Logs
```bash
# Docker Compose
docker-compose logs app

# Coolify
Check the application logs in Coolify dashboard
```

## Security Considerations

- Environment variables are not committed to git
- Images uploads are validated and sanitized
- Password protection for sensitive notes
- Rate limiting on image uploads
- Path traversal protection

## Performance

- Next.js standalone build for optimal production size
- Static asset optimization
- Efficient database queries with Prisma
- Image compression and validation
- CDN-ready static file serving
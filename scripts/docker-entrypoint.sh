#!/bin/sh

echo "Starting application with database setup..."

# Schema is already set to production during build, no need to copy

# Wait for database to be ready
echo "Waiting for database to be ready..."
until npx prisma db pull > /dev/null 2>&1 || npx prisma migrate deploy > /dev/null 2>&1; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready. Running migrations..."

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client (if needed)
npx prisma generate

echo "Starting Next.js application..."
exec node server.js